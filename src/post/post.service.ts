import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { User } from '../auth/entities/user.entity';
import { FilesAzureService } from '../file/file.azure.service';
import { Like } from 'src/like/entities/like.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private filesAzureService: FilesAzureService,
  ) {}

  private formatPostResponse(post: Post) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      address: post.address,
      latitude: post.latitude,
      longitude: post.longitude,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        loginType: post.author.loginType,
        email: post.author.email,
        nickName: post.author.nickName,
        imageUri: post.author.imageUri,
      },
    };
  }

  async create(
    userId: number,
    createPostDto: CreatePostDto,
    file: Express.Multer.File,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const imageUrl = file
      ? await this.filesAzureService.uploadFile(file, 'fileupload')
      : null;

    const latitude = createPostDto.latitude;
    const longitude = createPostDto.longitude;

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('유효하지 않은 위도 또는 경도 값입니다.');
    }

    const post = this.postRepository.create({
      ...createPostDto,
      imageUrl,
      latitude,
      longitude,
      author: user,
    });
    return this.postRepository.save(post);
  }

  async findAll() {
    const posts = await this.postRepository.find({ relations: ['author'] });
    return posts.map((post) => this.formatPostResponse(post));
  }

  async findOne(id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('ID는 숫자여야 합니다.');
    }
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) {
      throw new NotFoundException(`ID가 "${id}" 인 게시물을 찾을 수 없습니다.`);
    }

    post.latitude = post.latitude;
    post.longitude = post.longitude;

    return this.formatPostResponse(post);
  }

  async update(
    userId: number,
    id: number,
    updatePostDto: UpdatePostDto,
    file: Express.Multer.File,
  ) {
    const post = await this.findOne(id);
    if (post.author.id !== userId) {
      throw new UnauthorizedException(
        '자신의 게시물만 업데이트할 수 있습니다.',
      );
    }

    if (file) {
      const imageUrl = await this.filesAzureService.uploadFile(
        file,
        'fileupload',
      );
      post.imageUrl = imageUrl;
    }

    const latitude = updatePostDto.latitude ?? post.latitude;
    const longitude = updatePostDto.longitude ?? post.longitude;

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('유효하지 않은 위도 또는 경도 값입니다.');
    }

    Object.assign(post, updatePostDto, { latitude, longitude });
    const updatedPost = await this.postRepository.save(post);
    return this.formatPostResponse(updatedPost);
  }

  async remove(userId: number, id: number) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'comments'],
    });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    if (post.author.id !== userId) {
      throw new UnauthorizedException(
        '자신이 작성한 게시물만 삭제할 수 있습니다.',
      );
    }
    await this.likeRepository.delete({ post: { id } });

    // 댓글 삭제
    await this.commentRepository.delete({ post: { id } });

    return this.postRepository.remove(post);
  }

  async findAllWithMarkers() {
    try {
      const posts = await this.postRepository.find({ relations: ['author'] });
      return posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl,
        address: post.address,
        latitude: post.latitude,
        longtitue: post.longitude,
        author: {
          id: post.author.id,
          nickName: post.author.nickName,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch posts with markers:', error);
      throw new Error('Failed to fetch posts with markers');
    }
  }
}
