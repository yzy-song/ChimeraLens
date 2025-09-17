export interface AiProvider {
  run(inputs: Record<string, any>): Promise<string | string[]>;
}
