import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { Roles } from '@common/decorators/role.decorator';
import { UserInfo } from '@common/decorators/get-user.decorator';
import { ProcessId } from '@common/decorators/processid.decorator';
import { ROLE } from '@common/constant/enum/action.constant';
import { User } from '@common/schemas/user-access/user.schema';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import {
  AnswerCareerAssessmentDto,
  CareerAssessmentFeedbackDto,
  StartCareerAssessmentDto,
  CompleteCareerAssessmentDto,
  CareerAssessmentAcademicDto,
} from '../dto/career-assessment.dto';
import axios from 'axios';

@Controller('career-assessments')
@Authorization({ secured: true })
@Roles([ROLE.MEMBER])
export class CareerAssessmentGatewayController {
  constructor(
    @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly client: TcpClient
  ) {}
  @Post() start(
    @Body() body: StartCareerAssessmentDto,
    @UserInfo() user: User,
    @ProcessId() pid: string
  ) {
    const source = body.context || {};
    const context = Object.fromEntries(
      ['strongSubjects', 'preferredEnvironment', 'budget', 'location']
        .map((key) => [
          key,
          String(source[key] || '')
            .trim()
            .slice(0, 100),
        ])
        .filter(([, value]) => value)
    );
    return this.call(
      TCP_USER_ACCESS_SERVICE_MESSAGE.START_CAREER_ASSESSMENT,
      { userId: user.id, context },
      pid
    );
  }
  @Get('me/history') history(@UserInfo() user: User, @ProcessId() pid: string) {
    return this.call(
      TCP_USER_ACCESS_SERVICE_MESSAGE.HISTORY_CAREER_ASSESSMENT,
      { userId: user.id },
      pid
    );
  }
  /** Experts for the result page; `families` = the student's top family codes, best first. */
  @Get('experts') experts(
    @Query('families') families: string,
    @Query('limit') limit: string,
    @ProcessId() pid: string
  ) {
    return this.call(
      TCP_USER_ACCESS_SERVICE_MESSAGE.EXPERTS_CAREER_ASSESSMENT,
      { families: String(families || '').slice(0, 300), limit: Number(limit) || 4 },
      pid
    );
  }
  @Get(':id/next') next(
    @Param('id') id: string,
    @UserInfo() user: User,
    @ProcessId() pid: string
  ) {
    return this.call(
      TCP_USER_ACCESS_SERVICE_MESSAGE.NEXT_CAREER_ASSESSMENT,
      { id, userId: user.id },
      pid
    );
  }
  @Post(':id/answers') answer(
    @Param('id') id: string,
    @Body() answer: AnswerCareerAssessmentDto,
    @UserInfo() user: User,
    @ProcessId() pid: string
  ) {
    return this.call(
      TCP_USER_ACCESS_SERVICE_MESSAGE.ANSWER_CAREER_ASSESSMENT,
      { id, userId: user.id, answer },
      pid
    );
  }
  @Post(':id/academic') academic(
    @Param('id') id: string,
    @Body() academic: CareerAssessmentAcademicDto,
    @UserInfo() user: User,
    @ProcessId() pid: string
  ) {
    return this.call(
      TCP_USER_ACCESS_SERVICE_MESSAGE.ACADEMIC_CAREER_ASSESSMENT,
      { id, userId: user.id, academic },
      pid
    );
  }
  @Post(':id/complete') async complete(
    @Param('id') id: string,
    @Body() body: CompleteCareerAssessmentDto,
    @UserInfo() user: User,
    @ProcessId() pid: string
  ) {
    let result: any = await this.raw(
      TCP_USER_ACCESS_SERVICE_MESSAGE.COMPLETE_CAREER_ASSESSMENT,
      { id, userId: user.id },
      pid
    );
    if (!body?.useAiReview || result?.aiReview?.status === 'completed')
      return new ResponseDto({ data: result });
    try {
      const token = process.env['AGENTIC_INTERNAL_TOKEN']?.trim();
      if (!token) throw new Error('internal_token_missing');
      const response = await axios.post(
        `${
          process.env['AGENTIC_AI_SERVICE_URL'] || 'http://localhost:8000'
        }/career-prediction/review`,
        {
          riasec_code: result.personalProfile?.riasecCode || 'UNKNOWN',
          strengths: (result.strengths || [])
            .slice(0, 8)
            .map((item: any) => item.facet),
          candidates: (result.topGroups || []).slice(0, 5).map((item: any) => ({
            code: item.code,
            name: item.name,
            match_score: item.matchScore,
            signals: item.signals || {},
            fit_reasons: (item.fitReasons || [])
              .map((reason: any) => reason.label)
              .slice(0, 4),
          })),
        },
        { timeout: 35_000, headers: { 'X-Internal-Token': token } }
      );
      const review = response.data?.review;
      if (!response.data?.success || !review)
        throw new Error('invalid_ai_response');
      result = await this.raw(
        TCP_USER_ACCESS_SERVICE_MESSAGE.SAVE_AI_CAREER_REVIEW,
        {
          id,
          userId: user.id,
          review: {
            status: 'completed',
            model: response.data.model,
            summary: review.summary,
            rankedCandidates: review.ranked_candidates,
            agreements: review.agreements,
            cautions: review.cautions,
            validationQuestions: review.validation_questions,
            nextActions: review.next_actions,
          },
        },
        pid
      );
    } catch (error) {
      result = await this.raw(
        TCP_USER_ACCESS_SERVICE_MESSAGE.SAVE_AI_CAREER_REVIEW,
        {
          id,
          userId: user.id,
          review: {
            status: 'unavailable',
            reason: axios.isAxiosError(error)
              ? `http_${error.response?.status || 'unreachable'}`
              : 'not_configured',
          },
        },
        pid
      );
    }
    return new ResponseDto({ data: result });
  }
  @Post(':id/feedback') feedback(
    @Param('id') id: string,
    @Body() feedback: CareerAssessmentFeedbackDto,
    @UserInfo() user: User,
    @ProcessId() pid: string
  ) {
    return this.call(
      TCP_USER_ACCESS_SERVICE_MESSAGE.FEEDBACK_CAREER_ASSESSMENT,
      { id, userId: user.id, feedback },
      pid
    );
  }
  @Get(':id') get(
    @Param('id') id: string,
    @UserInfo() user: User,
    @ProcessId() pid: string
  ) {
    return this.call(
      TCP_USER_ACCESS_SERVICE_MESSAGE.GET_CAREER_ASSESSMENT,
      { id, userId: user.id },
      pid
    );
  }
  private async call(pattern: string, data: any, processId: string) {
    return new ResponseDto({ data: await this.raw(pattern, data, processId) });
  }
  private async raw(pattern: string, data: any, processId: string) {
    return firstValueFrom(
      this.client
        .send<any, any>(pattern, { data, processId })
        .pipe(map((row) => row.data))
    );
  }
}
