import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "video_id required"}))
        sys.exit(1)

    video_id = sys.argv[1]
    try:
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id)
        items = [
            {"text": s.text, "start": s.start, "duration": s.duration}
            for s in transcript.snippets
        ]
        print(json.dumps({"items": items}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
