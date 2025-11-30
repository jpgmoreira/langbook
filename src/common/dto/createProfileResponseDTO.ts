import { RendererResponseDTO } from './rendererResponseDTO';

export type CreateProfileResponseDTO =
  | {
      status: 'error';
      errorMsg: string;
    }
  | {
      status: 'success';
      data: RendererResponseDTO;
    };
