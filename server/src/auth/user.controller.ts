import {
    Controller,
    UseGuards,
    Get,
    Body,
    Post,
    UseInterceptors,
    UploadedFile,
    NotAcceptableException,
    ParseIntPipe,
    Param,
    HttpStatus,
    HttpCode,
  } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from './user.entity';
import { GetUser } from './decorator/get-user.decorator';
import { CollectType, StructuredUserDto } from './dto/structured-user.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './dto/create-user.dto';
import { UploadService } from '../file/upload.service';
import { Any } from 'typeorm';
import { AnyAuthGuard } from './guards/any-auth.guard';
import { UserOnlineService } from './user-online.service';

  @Controller('user')
  export class UserController {
    constructor(
        private userService: UserService, 
        private userOnlineService: UserOnlineService, 
        private uploadService: UploadService
    ) {}

    @Get('/:id/info')
    // @UseGuards(AuthGuard())
    async infoById(
        @Param('id', ParseIntPipe) id: number,
        @GetUser() user: User,
    ): Promise<StructuredUserDto> {
        const u = new User();
        u.id = id;
        let structured = this.info(u);

        return structured;
    }

    @Get('/info')
    @UseGuards(AuthGuard())
    async info(
        @GetUser() user: User,
    ): Promise<StructuredUserDto> {
        const u = await this.userService.getUserById(user.id);

        // 關注
        let structured = new StructuredUserDto(u);
        let collected:any = [];
        let joinedTeamsList:any = null;
        let ownedTeamsList:any = null;
        let ownedTopicList:any = null;
        let ownedCCPList:any = null;
        let colcollectedTopicList:any = null;
        
        structured.collected = collected;
        structured.joinedTeams = joinedTeamsList;
        structured.ownedTeams = ownedTeamsList;
        structured.ownedTopic = ownedTopicList;
        structured.ownedCCP = ownedCCPList;
        structured.collectedTopic = colcollectedTopicList;
        return structured;
    }

    @Post('/setting')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard())
    async setting(
        @Body() body: CreateUserDto,
        @GetUser() user: User,
    ) {
        if (body.id != user.id) {
            throw new NotAcceptableException(`Not allowed operation.`);
        }
        const news = await this.userService.saveUserSetting(body);
        return 'SUCCESS';
    }

    @Post('/avatar')
    @UseInterceptors(FileInterceptor('file'))
    @UseGuards(AuthGuard())
    async avatar(
        @UploadedFile() file,
        @GetUser() user: User,
    ): Promise<boolean> {
        const u = await this.userService.getUserById(user.id);
        if (file) {
            await this.uploadService.savePhotoToProfile(file, u);
        }
        return true;
    }

    @Get('/statistic')
    @UseGuards(AuthGuard())
    async statistic(@GetUser() user: User) {
        const u = await this.userService.getStatistic(user.id);
        const result = { createDate: u.createDate, showname: u.showname, id: u.id, statistic: await u.statistic};
        console.info('statistic result', result);
        return result;
    }

    @Get('/online/number')
    async onlineNumber() {
        const u = await this.userOnlineService.getOnlineNumber();
        return u;
    }
  
  }
  