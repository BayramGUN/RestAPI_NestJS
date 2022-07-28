import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as pactum from 'pactum'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'
import { AuthDto } from 'src/auth/dto'
import { UserDto } from 'src/auth/dto/user.dto'
import { EditUserDto } from 'src/user/dto'
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto'

describe('App e2e', () => {
  let app: INestApplication
  let prisma: PrismaService
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true
      })
    )
    await app.init()
    await app.listen(3000)
    prisma = app.get(PrismaService)

    await prisma.cleanDb()
    pactum.request.setBaseUrl('http://localhost:3000')
  })
  afterAll(() => {
    app.close()
  })
  // for test authentication
  describe('Auth', () => {
    describe('Signup', () => {
      const dto: UserDto = {
        email: 'test@example.com',
        password: 'testpassword123*',
        firstName: 'testName',
        lastName: 'testLastName'
      }
      it('should throw an exception if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup').withBody({
            password: dto.password,
            firstName: dto.firstName,
            lastName: dto.lastName
          })
          .expectStatus(400)
      })
      it('should throw an exception if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup').withBody({
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName
          })
          .expectStatus(400)
      })
      it('should throw an exception if firstname is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup').withBody({
            email: dto.email,
            password: dto.password,
            lastName: dto.lastName
          })
          .expectStatus(400)
      })
      it('should throw an exception if lastname is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup').withBody({
            email: dto.email,
            password: dto.password,
            firstName: dto.firstName
          })
          .expectStatus(400)
      })
      it('should throw an exception if no body has provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(400)
      })
      it('should sign-up', () => {
        return pactum
          .spec()
          .post('/auth/signup').withBody(dto)
          .expectStatus(201)
      })
    })
    describe('Signin', () => {
      const dto: AuthDto = {
        email: 'test@example.com',
        password: 'testpassword123*'
      }
      it('should throw an exception if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin').withBody({
            password: dto.password
          })
          .expectStatus(400)
      })
      it('should throw an exception if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin').withBody({
            email: dto.email
          })
          .expectStatus(400)
      })
      it('should throw an exception if no body has provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(400)
      })
      it('should sign-in', () => {
        return pactum
          .spec()
          .post('/auth/signin').withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
      })
    })
  })

  // for test users
  describe('User', () => {
    describe('Edit user', () => {
      it('should edit current user', () => {
        const dto: EditUserDto = {
          firstName: 'edit-test firstName',
          email: 'email@birtuhafadamdir.com'
        }
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email)
      })
    })
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
      })
    })
  })

  // for test bookmarks
  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectBody([])
      })
    })
    describe('Create bookmark', () => {
      it('should create bookmark', () => {
        const dto: CreateBookmarkDto = {
          title: 'test-title',
          link: 'test.bookmark.net',
          description: 'yeyeo'
        }
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id')
      })
    })
    describe('Get bookmarks', () => {
      it('should get all bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectJsonLength(1)
      })
    })
    describe('Get bookmark by id', () => {
      it('should get a bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
      })
    })
    describe('edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'edit-test title',
        description: 'edit-test description'
      }
      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.description)
          .expectBodyContains(dto.title)
      })
    })
    describe('delete bookmark', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(204)
      })
      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectJsonLength(0)
      })
    })
  })
})
