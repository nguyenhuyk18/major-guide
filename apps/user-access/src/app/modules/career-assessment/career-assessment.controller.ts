import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { CareerAssessmentService } from './career-assessment.service';
import { CareerExpertService } from './career-expert.service';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class CareerAssessmentController {
  constructor(
    private readonly service: CareerAssessmentService,
    private readonly experts: CareerExpertService
  ) {}
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.START_CAREER_ASSESSMENT)
  start(@RequestParams() d: any) {
    return this.wrap(this.service.start(d.userId, d.context));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.NEXT_CAREER_ASSESSMENT) next(
    @RequestParams() d: any
  ) {
    return this.wrap(this.service.next(d.id, d.userId));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.ANSWER_CAREER_ASSESSMENT)
  answer(@RequestParams() d: any) {
    return this.wrap(this.service.answer(d.id, d.userId, d.answer));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.ACADEMIC_CAREER_ASSESSMENT)
  academic(@RequestParams() d: any) {
    return this.wrap(this.service.setAcademic(d.id, d.userId, d.academic));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.COMPLETE_CAREER_ASSESSMENT)
  complete(@RequestParams() d: any) {
    return this.wrap(this.service.complete(d.id, d.userId));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_CAREER_ASSESSMENT) get(
    @RequestParams() d: any
  ) {
    return this.wrap(this.service.get(d.id, d.userId));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.HISTORY_CAREER_ASSESSMENT)
  history(@RequestParams() d: any) {
    return this.wrap(this.service.history(d.userId));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.FEEDBACK_CAREER_ASSESSMENT)
  feedback(@RequestParams() d: any) {
    return this.wrap(this.service.feedback(d.id, d.userId, d.feedback));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.SAVE_AI_CAREER_REVIEW)
  saveAiReview(@RequestParams() d: any) {
    return this.wrap(this.service.saveAiReview(d.id, d.userId, d.review));
  }
  @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.EXPERTS_CAREER_ASSESSMENT)
  recommendExperts(@RequestParams() d: any) {
    return this.wrap(this.experts.recommend(d.families, d.limit));
  }
  private async wrap(value: Promise<any>) {
    return ResponseTcp.success(await value);
  }
}
