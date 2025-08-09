type Livestream = {
    id: number;
    slug: string;
    channel_id: number;
    created_at: Date;
    session_title: string;
    is_live: boolean;
    risk_level_id: null;
    start_time: Date;
    source: null;
    twitch_channel: null;
    duration: number;
    language: string;
    is_mature: boolean;
    viewer_count: number;
    thumbnail: string;
    channel: Channel;
    categories: CategoryElement[];
};
type CategoryElement = {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    tags: string[];
    description: null;
    deleted_at: null;
    viewers: number;
    category: CategoryCategory;
};
type CategoryCategory = {
    id: number;
    name: string;
    slug: string;
    icon: string;
};
type Channel = {
    id: number;
    user_id: number;
    slug: string;
    is_banned: boolean;
    playback_url: string;
    name_updated_at: null;
    vod_enabled: boolean;
    subscription_enabled: boolean;
    followersCount: number;
    user: User;
    can_host: boolean;
    verified: Verified;
};
type User = {
    profilepic: string;
    bio: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube: string;
    discord: string;
    tiktok: string;
    username: string;
};
type Verified = {
    id: number;
    channel_id: number;
    created_at: Date;
    updated_at: Date;
};

interface ClientOptions {
    plainEmote?: boolean;
    logger?: boolean;
    readOnly?: boolean;
}
interface Video {
    id: number;
    title: string;
    thumbnail: string;
    duration: number;
    live_stream_id: number;
    start_time: Date;
    created_at: Date;
    updated_at: Date;
    uuid: string;
    views: number;
    stream: string;
    language: string;
    livestream: Livestream;
    channel: Channel;
}
interface KickClient {
    on: (event: string, listener: (...args: any[]) => void) => void;
    vod: (video_id: string) => Promise<Video>;
    login: (credentials: LoginOptions) => Promise<boolean>;
    user: {
        id: number;
        username: string;
        tag: string;
    } | null;
    sendMessage: (messageContent: string) => Promise<void>;
    banUser: (targetUser: string, durationInMinutes?: number, permanent?: boolean) => Promise<void>;
    unbanUser: (targetUser: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    slowMode: (mode: "on" | "off", durationInSeconds?: number) => Promise<void>;
    getPoll: (targetChannel?: string) => Promise<Poll | null>;
    getLeaderboards: (targetChannel?: string) => Promise<Leaderboard | null>;
}
type LoginCredentials = {
    username: string;
    password: string;
    otp_secret: string;
};
type TokenCredentials = {
    bearerToken: string;
    xsrfToken: string;
    cookies: string;
};
type LoginOptions = {
    type: "login";
    credentials: LoginCredentials;
} | {
    type: "tokens";
    credentials: TokenCredentials;
};
type Poll = {
    status: {
        code: number;
        message: string;
        error: boolean;
    };
    data: {
        title: string;
        duration: number;
        result_display_duration: number;
        created_at: Date;
        options: {
            id: number;
            label: string;
            votes: number;
        }[];
        remaining: number;
        has_voted: boolean;
        voted_option_id: null;
    };
};
type Leaderboard = {
    gifts: Gift[];
    gifts_enabled: boolean;
    gifts_week: Gift[];
    gifts_week_enabled: boolean;
    gifts_month: Gift[];
    gifts_month_enabled: boolean;
};
type Gift = {
    user_id: number;
    username: string;
    quantity: number;
};

declare const createClient: (channelName: string, options?: ClientOptions) => KickClient;

interface MessageData {
    id: string;
    chatroom_id: number;
    content: string;
    type: string;
    created_at: string;
    sender: {
        id: number;
        username: string;
        slug: string;
        identity: {
            color: string;
            badges: unknown;
        };
    };
    metadata?: {
        original_sender: {
            id: string;
            username: string;
        };
        original_message: {
            id: string;
            content: string;
        };
    };
}

export { type MessageData, createClient };
