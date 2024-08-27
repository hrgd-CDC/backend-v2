import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: '게시글 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '게시글 내용' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '게시글 주소' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: '위도', required: false })
  @IsLatitude()
  @IsOptional()
  latitude: number;

  @ApiProperty({ description: '경도', required: false })
  @IsLongitude()
  @IsOptional()
  longitude: number;
}
