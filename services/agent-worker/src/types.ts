export interface LLMCallOptions {
  model?: string;
  schema?: Record<string, unknown>;
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMProvider {
  name: string;
  call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse>;
}