"""
Fetch YouTube auto-captions for a given video ID and emit them as JSON.

Uses yt-dlp because youtube-transcript-api has become unreliable on shared
hosts (Replit, etc.) — YouTube rate-limits the InnerTube transcript endpoint
heavily, but the static caption CDN that yt-dlp pulls from is much harder
to block.

Output format (unchanged from previous impl):
  { "items": [{"text": str, "start": float, "duration": float}, ...] }
or { "error": "<message>" } on failure.
"""

import json
import sys
import urllib.request

try:
    import yt_dlp
except ImportError:
    print(json.dumps({"error": "yt-dlp not installed — run: pip install yt-dlp"}))
    sys.exit(1)


def fetch_captions_url(video_id: str) -> str:
    """Use yt-dlp to extract the JSON3 auto-caption URL for English."""
    ydl_opts = {
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        "writeautomaticsub": False,
        "writesubtitles": False,
    }
    url = f"https://www.youtube.com/watch?v={video_id}"
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    # Prefer manual subs over auto-captions when available
    subs = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}

    # English variants in priority order
    candidates = ["en", "en-US", "en-GB", "en-orig"]
    chosen = None
    for source in (subs, auto):
        for lang in candidates:
            if lang in source and source[lang]:
                chosen = source[lang]
                break
        if chosen:
            break

    # Last resort: any English-prefixed track
    if not chosen:
        for source in (subs, auto):
            for lang, tracks in source.items():
                if lang.startswith("en"):
                    chosen = tracks
                    break
            if chosen:
                break

    if not chosen:
        raise RuntimeError("No English caption track available for this video.")

    # Pick json3 format — easiest to parse with start/duration
    json3 = next((t for t in chosen if t.get("ext") == "json3"), None)
    if not json3:
        raise RuntimeError("Caption track has no json3 format.")
    return json3["url"]


def parse_json3(url: str):
    """Download the json3 caption file and convert to {text,start,duration} items."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    items = []
    for event in data.get("events", []):
        segs = event.get("segs")
        if not segs:
            continue
        text = "".join(s.get("utf8", "") for s in segs).strip()
        if not text:
            continue
        start_ms = event.get("tStartMs", 0)
        dur_ms = event.get("dDurationMs", 0)
        items.append({
            "text": text,
            "start": round(start_ms / 1000, 3),
            "duration": round(dur_ms / 1000, 3),
        })
    return items


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "video_id required"}))
        sys.exit(1)

    video_id = sys.argv[1]
    try:
        caption_url = fetch_captions_url(video_id)
        items = parse_json3(caption_url)
        if not items:
            print(json.dumps({"error": "Caption track was empty."}))
            sys.exit(1)
        print(json.dumps({"items": items}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
