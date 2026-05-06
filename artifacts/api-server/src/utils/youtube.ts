export interface YouTubeVideo {
  title: string;
  channel: string;
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
      items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string; publishedAt: string } }[]
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
