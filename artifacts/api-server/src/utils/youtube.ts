export interface YouTubeVideo {
  title: string;
  channel: string;
  channelId: string;
  publishedAt: string;
  videoId: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export async function fetchTopYouTubeVideos(query: string, maxResults = 12): Promise<YouTubeVideo[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) return [];
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json() as {
      items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string; channelId: string; publishedAt: string } }[]
    };
    if (!searchData.items?.length) return [];

    const videoIds = searchData.items.map(v => v.id.videoId).join(",");
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json() as {
      items?: { id: string; statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }[]
    };
    const statsMap: Record<string, { viewCount?: string; likeCount?: string; commentCount?: string }> = {};
    for (const v of statsData.items ?? []) statsMap[v.id] = v.statistics;

    return searchData.items.map(v => ({
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      channelId: v.snippet.channelId,
      publishedAt: v.snippet.publishedAt,
      videoId: v.id.videoId,
      viewCount: statsMap[v.id.videoId]?.viewCount || "0",
      likeCount: statsMap[v.id.videoId]?.likeCount || "0",
      commentCount: statsMap[v.id.videoId]?.commentCount || "0",
    }));
  } catch {
    return [];
  }
}

/**
 * YouTube's public autocomplete endpoint. Free, no API key, returns the
 * actual suggestions YouTube would show in its search box for `seed`.
 * These are the queries real viewers are typing — the closest thing to
 * "search demand" YouTube exposes publicly.
 */
export async function fetchYouTubeSuggestions(seed: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(seed)}`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const text = await res.text();
    // Response is a JSONP-ish array: ["seed", [["sug1", ...], ["sug2", ...]], {...}]
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed?.[1]) ? parsed[1] : [];
    return list
      .map((entry: unknown) => (Array.isArray(entry) ? String(entry[0]) : String(entry)))
      .filter((s: string) => s && s.length > 0);
  } catch {
    return [];
  }
}

/**
 * Batch-fetch subscriber counts for the given channel IDs in one API call
 * (channels.list costs 1 quota unit and accepts up to 50 IDs per request).
 */
export async function fetchChannelSubscriberMap(channelIds: string[]): Promise<Record<string, number>> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY || channelIds.length === 0) return {};
  const unique = Array.from(new Set(channelIds)).slice(0, 50);
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${unique.join(",")}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json() as {
      items?: { id: string; statistics: { subscriberCount?: string } }[]
    };
    const map: Record<string, number> = {};
    for (const item of data.items ?? []) {
      map[item.id] = Number(item.statistics?.subscriberCount ?? 0);
    }
    return map;
  } catch {
    return {};
  }
}
