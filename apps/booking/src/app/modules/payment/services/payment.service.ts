import { CreateLinkApiVnpayRequestTcp } from "@common/interfaces/tcp/booking/create-link-vnpay-tcp-request.interface";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    VNPay,
    HashAlgorithm,
    ProductCode,
    VnpLocale,
    dateFormat,
} from "vnpay";
import { ReverseService } from "../../reserve/services/reverse.service";

@Injectable()
export class PaymentService {
    private vnpay: VNPay;

    private returnUrl: string;
    // private ipnUrl: string;
    private locale: VnpLocale;

    constructor(private readonly configService: ConfigService,
        private readonly reverseService: ReverseService
    ) {
        // load config
        const tmnCode = this.configService.get<string>("VNPAY_CONFIG.VNP_TMN_CODE");
        const secret = this.configService.get<string>("VNPAY_CONFIG.VNP_HASH_SECRET");
        const vnpUrl = this.configService.get<string>("VNPAY_CONFIG.VNP_URL");

        this.returnUrl = this.configService.get<string>("VNPAY_CONFIG.VNP_RETURN_URL");
        // this.ipnUrl = this.configService.get<string>("VNPAY_CONFIG.VNP_IPN_URL");
        this.locale =
            (this.configService.get<string>("VNPAY_CONFIG.VPN_LOCALE") as VnpLocale) ||
            VnpLocale.VN;

        // init VNPay
        this.vnpay = new VNPay({
            tmnCode,
            secureSecret: secret,
            vnpayHost: vnpUrl,
            testMode: true,
            hashAlgorithm: HashAlgorithm.SHA512,

        });
    }

    /**
     * 🔥 TẠO LINK THANH TOÁN
     */
    createPaymentUrl(data: Partial<CreateLinkApiVnpayRequestTcp>) {
        const createDate = dateFormat(new Date());

        const paymentUrl = this.vnpay.buildPaymentUrl({
            vnp_TxnRef: data.orderId,
            vnp_Amount: data.amount, // Số tiền VNĐ
            vnp_IpAddr: "127.0.0.1",
            vnp_OrderInfo: data.description,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: this.returnUrl,
            vnp_Locale: this.locale,
            vnp_CreateDate: createDate,
            // vnp_IpnUrl: 'dsfsdfsdf',
        });

        return paymentUrl;
    }

    /**
     * 🔥 HANDLE IPN (QUAN TRỌNG NHẤT)
     * Check booking validity trước khi accept payment
     */
    async verifyIpn(query: { isValid: boolean, orderId: string, responseCode: string }) {


        if (!query.isValid) {
            return {
                RspCode: "97",
                Message: "Invalid signature",
            };
        }

        const { orderId, responseCode } = query;

        if (responseCode === "00") {
            // Check xem booking có còn valid không trước khi accept payment
            const bookingValid = await this.reverseService.checkBookingCanPay(orderId);
            
            if (!bookingValid.canPay) {
                return {
                    RspCode: "01",
                    Message: bookingValid.reason, // "Booking da bi huy hoac het han thanh toan"
                };
            }

            await this.reverseService.updatePaymentSuccess(orderId, {
                payment_date: new Date(),
                transaction_id: orderId,
            });
        } else {
            await this.reverseService.updateReverseFail(orderId);
            return {
                RspCode: "11",
                Message: "Confirm Failed",
            };
        }

        return {
            RspCode: "00",
            Message: "Confirm Success",
        };
    }
}