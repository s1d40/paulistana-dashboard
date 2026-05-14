// services/wordpress.ts

export interface WordPressPost {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  link: string;
  status: string;
  categories: number[];
  featured_media: number;
  yoast_head_json?: {
    og_image?: Array<{ url: string }>;
    description?: string;
  };
}

export async function fetchWordPressPosts(limit: number = 10): Promise<WordPressPost[]> {
  const baseUrl = process.env.WP_API_BASE_URL;
  const username = process.env.WP_USERNAME;
  const password = process.env.WP_PASSWORD;

  if (!baseUrl || !username || !password) {
    return [];
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/wp/v2/posts?per_page=${limit}&_embed`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Falha ao buscar posts do WordPress:', error);
    return [];
  }
}
