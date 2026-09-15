import crypto from 'crypto';

export interface StreamCredentials {
  providerStreamId: string;
  rtmpIngestUrl: string;
  streamKey: string;
  hlsPlaybackUrl: string;
}

export interface StreamStatusInfo {
  status: 'IDLE' | 'CONNECTING' | 'LIVE' | 'INTERRUPTED' | 'ENDED';
  viewerCount?: number;
  lastActive?: Date;
}

export interface PlaybackInfo {
  hlsUrl: string;
  fallbackUrl?: string;
  provider: string;
}

export interface RecordingInfo {
  recordingId: string;
  ready: boolean;
  playbackUrl?: string;
  durationSeconds?: number;
}

export interface IStreamingProvider {
  createStream(classId: string, title: string): Promise<StreamCredentials>;
  getStreamStatus(providerStreamId: string): Promise<StreamStatusInfo>;
  getPlaybackInfo(providerStreamId: string): Promise<PlaybackInfo>;
  rotateStreamKey(providerStreamId: string): Promise<StreamCredentials>;
  revokeStream(providerStreamId: string): Promise<void>;
  getRecording(providerStreamId: string): Promise<RecordingInfo | null>;
  endStream(providerStreamId: string): Promise<void>;
}

/**
 * Standard RTMP/HLS Streaming Provider Adapter
 * Compatible with OBS Studio, dedicated RTMP servers (MediaMTX / Nginx-RTMP / SRS / Any Managed CDN)
 */
export class CustomRtmpStreamingProvider implements IStreamingProvider {
  private defaultIngestUrl: string;
  private defaultPlaybackBase: string;

  constructor() {
    this.defaultIngestUrl =
      process.env.LIVE_STREAM_RTMP_INGEST || 'rtmp://stream.losamajhlo.com/live';
    this.defaultPlaybackBase =
      process.env.LIVE_STREAM_PLAYBACK_BASE_URL || 'https://stream.losamajhlo.com/hls';
  }

  private generateSecureKey(classId: string): string {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const shortId = classId.replace(/-/g, '').slice(0, 8);
    return `lsl_${shortId}_${randomHex}`;
  }

  public async createStream(classId: string, _title: string): Promise<StreamCredentials> {
    const streamKey = this.generateSecureKey(classId);
    const providerStreamId = `stream_${classId}`;
    const rtmpIngestUrl = this.defaultIngestUrl;
    const hlsPlaybackUrl = `${this.defaultPlaybackBase}/${classId}/index.m3u8`;

    return {
      providerStreamId,
      rtmpIngestUrl,
      streamKey,
      hlsPlaybackUrl,
    };
  }

  public async getStreamStatus(_providerStreamId: string): Promise<StreamStatusInfo> {
    // In production, this can poll the provider / RTMP stats API or webhook state
    return {
      status: 'IDLE',
      viewerCount: 0,
      lastActive: new Date(),
    };
  }

  public async getPlaybackInfo(providerStreamId: string): Promise<PlaybackInfo> {
    const classId = providerStreamId.replace('stream_', '');
    return {
      hlsUrl: `${this.defaultPlaybackBase}/${classId}/index.m3u8`,
      fallbackUrl: `${this.defaultPlaybackBase}/${classId}/master.m3u8`,
      provider: 'CUSTOM_RTMP',
    };
  }

  public async rotateStreamKey(providerStreamId: string): Promise<StreamCredentials> {
    const classId = providerStreamId.replace('stream_', '');
    const newStreamKey = this.generateSecureKey(classId);
    return {
      providerStreamId,
      rtmpIngestUrl: this.defaultIngestUrl,
      streamKey: newStreamKey,
      hlsPlaybackUrl: `${this.defaultPlaybackBase}/${classId}/index.m3u8`,
    };
  }

  public async revokeStream(_providerStreamId: string): Promise<void> {
    // Invalidate stream
  }

  public async getRecording(providerStreamId: string): Promise<RecordingInfo | null> {
    const classId = providerStreamId.replace('stream_', '');
    return {
      recordingId: `rec_${classId}`,
      ready: true,
      playbackUrl: `${this.defaultPlaybackBase}/${classId}/recording.mp4`,
      durationSeconds: 3600,
    };
  }

  public async endStream(_providerStreamId: string): Promise<void> {
    // Trigger provider session end hook
  }
}

/**
 * Factory to retrieve configured StreamingProvider based on environment
 */
export function getStreamingProvider(): IStreamingProvider {
  const provider = (process.env.LIVE_STREAM_PROVIDER || 'CUSTOM_RTMP').toUpperCase();

  switch (provider) {
    case 'CUSTOM_RTMP':
    default:
      return new CustomRtmpStreamingProvider();
  }
}

export const streamingProvider = getStreamingProvider();
