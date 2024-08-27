import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FilesAzureService {
  constructor(private readonly configService: ConfigService) {}
  private containerName: string;

  private async getBlobServiceInstance() {
    const connectionString =
      this.configService.get<string>('CONNECTION_STRING');
    if (!connectionString) {
      throw new InternalServerErrorException(
        'Azure Storage 연결 문자열이 설정되지 않았습니다.',
      );
    }
    const blobClientService =
      BlobServiceClient.fromConnectionString(connectionString);
    return blobClientService;
  }

  private async getBlobClient(imageName: string): Promise<BlockBlobClient> {
    const blobService = await this.getBlobServiceInstance();
    const containerName = this.containerName;
    const containerClient = blobService.getContainerClient(containerName);

    // 컨테이너가 존재하는지 확인하고, 존재하지 않으면 생성
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create();
    }

    const blockBlobClient = containerClient.getBlockBlobClient(imageName);
    return blockBlobClient;
  }

  public async uploadFile(file: Express.Multer.File, containerName: string) {
    this.containerName = containerName;
    const extension = file.originalname.split('.').pop();
    const file_name = uuid() + '.' + extension;
    const blockBlobClient = await this.getBlobClient(file_name);
    const fileUrl = blockBlobClient.url;
    await blockBlobClient.uploadData(file.buffer);

    return fileUrl;
  }

  async deleteFile(file_name: string, containerName: string) {
    this.containerName = containerName;
    const blockBlobClient = await this.getBlobClient(file_name);
    await blockBlobClient.delete();
  }
}
