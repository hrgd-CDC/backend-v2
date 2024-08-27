import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('Post')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: '게시글 생성' })
  @ApiResponse({ status: 201, description: '게시글 생성 성공' })
  @ApiBearerAuth()
  create(
    @Request() req,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postService.create(req.user.id, createPostDto, file);
  }

  @Get()
  @ApiOperation({ summary: '모든 게시글 조회' })
  @ApiResponse({ status: 200, description: '게시글 조회 성공' })
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 게시글 조회' })
  @ApiResponse({ status: 200, description: '게시글 조회 성공' })
  findOne(@Param('id') id: string) {
    const postId = Number(id);
    if (isNaN(postId)) {
      throw new BadRequestException('ID는 숫자여야 합니다.');
    }
    return this.postService.findOne(postId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: '게시글 수정' })
  @ApiResponse({ status: 200, description: '게시글 수정 성공' })
  @ApiBearerAuth()
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const postId = Number(id);
    if (isNaN(postId)) {
      throw new BadRequestException('ID는 숫자여야 합니다.');
    }
    return this.postService.update(req.user.id, postId, updatePostDto, file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '게시글 삭제' })
  @ApiResponse({ status: 200, description: '게시글 삭제 성공' })
  @ApiBearerAuth()
  remove(@Request() req, @Param('id') id: string) {
    const postId = Number(id);
    if (isNaN(postId)) {
      throw new BadRequestException('ID는 숫자여야 합니다.');
    }
    return this.postService.remove(req.user.id, postId);
  }

  @Get('markers')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '모든 게시글 마커 조회' })
  @ApiResponse({ status: 200, description: '게시글 마커 조회 성공' })
  findAllWithMarkers() {
    return this.postService.findAllWithMarkers();
  }
}
