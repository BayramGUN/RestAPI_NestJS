import { ForbiddenException, Injectable } from '@nestjs/common'
import { AuthDto } from './dto/index'
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { UserDto } from './dto/user.dto'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
@Injectable({})
export class AuthService {
  // eslint-disable-next-line no-useless-constructor
  constructor (
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) {}

  async signup (dto: UserDto) {
    // generate the password hash
    const hash = await argon.hash(dto.password)
    // save the new user in the db
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
          firstName: dto.firstName,
          lastName: dto.lastName
        }
      })

      return this.signToken(user.id, user.email)
    } catch (error) {
      if (error instanceof
        PrismaClientKnownRequestError &&
        error.code === 'P2002') {
        throw new ForbiddenException('Creadentials taken already')
      }
      throw error
    }
  }

  async signin (dto: AuthDto) {
    // find the user by email
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email
        }
      })
    // if user does not exist throw exception
    if (!user) {
      throw new ForbiddenException(
        'Creadintials are incorrect'
      )
    }
    // compare password
    const pwMatches = await argon.verify(user.hash, dto.password)
    // if password incorrect throw exception
    if (!pwMatches) {
      throw new ForbiddenException(
        'Creadintials are incorrect'
      )
    }
    // send back the user
    return this.signToken(user.id, user.email)
  }

  async signToken (
    userId: number,
    email: string
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email
    }
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET')
    })
    return {
      access_token: token
    }
  }
}
