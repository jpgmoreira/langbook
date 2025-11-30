import { RendererRequestDTO } from './rendererRequestDTO';

export type CreateProfileResponseDTO =
  | {
      status: 'error';
      errorMsg: string;
    }
  | {
      status: 'success';
      data: RendererRequestDTO;
    };
