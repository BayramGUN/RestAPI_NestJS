import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as pactum from 'pactum'
import { PrismaService } from '../src/prisma/prisma.service'
import { AppModule } from '../src/app.module'
import { AuthDto } from 'src/auth/dto'
import { UserDto } from 'src/auth/dto/user.dto'

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
  /*  describe('User', () => {
    describe('Get me', () => {})
    describe('Edit user', () => {})
  }) */

  // for test bookmarks
  /* describe('Bookmarks', () => {
    describe('Get bookmark by id', => {})
    describe('Get bookmarks', => {})
    describe('Create bookmark', => {})
    describe('edit bookmark', => {})
    describe('delete bookmark', => {})
  }) */
})
