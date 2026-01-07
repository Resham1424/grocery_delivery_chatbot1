
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: GroundingSource[];
  imageUrl?: string;
  isGeneratedImage?: boolean;
}

export interface Suggestion {
  title: string;
  prompt: string;
  icon: string;
}
