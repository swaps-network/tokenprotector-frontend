export interface ITsStepper {
  current?: string;
  number?: number;
  button?: {
    process?: boolean;
    error?: boolean;
  }
}