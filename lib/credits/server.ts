import { adminRequest } from "../billing/admin";

type ReservationRow = {
  job_id: string;
  balance: number;
};

type BalanceRow = {
  balance: number;
};

export type CreditReservation = {
  jobId: string;
  balance: number;
  cost: number;
};

export class CreditReservationError extends Error {
  code: "INSUFFICIENT_CREDITS" | "CREDIT_SERVICE_UNAVAILABLE";

  constructor(
    code: "INSUFFICIENT_CREDITS" | "CREDIT_SERVICE_UNAVAILABLE",
  ) {
    super(code);
    this.code = code;
  }
}

export async function reserveServiceCredits({
  userId,
  serviceId,
  fileName,
  cost,
}: {
  userId: string;
  serviceId: string;
  fileName: string;
  cost: number;
}): Promise<CreditReservation> {
  const jobId = crypto.randomUUID();

  try {
    const rows = await adminRequest<ReservationRow[]>(
      "rpc/reserve_service_credits",
      {
        method: "POST",
        body: JSON.stringify({
          p_user_id: userId,
          p_job_id: jobId,
          p_service_id: serviceId,
          p_file_name: fileName,
          p_cost: cost,
        }),
      },
    );

    if (!rows[0]) throw new Error("Credit reservation returned no result.");
    return { jobId, balance: rows[0].balance, cost };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("INSUFFICIENT_CREDITS")) {
      throw new CreditReservationError("INSUFFICIENT_CREDITS");
    }
    throw new CreditReservationError("CREDIT_SERVICE_UNAVAILABLE");
  }
}

export async function completeServiceCredits(
  userId: string,
  jobId: string,
  metrics: Record<string, unknown> = {},
) {
  const rows = await adminRequest<BalanceRow[]>(
    "rpc/complete_service_job",
    {
      method: "POST",
      body: JSON.stringify({
        p_user_id: userId,
        p_job_id: jobId,
        p_metrics: metrics,
      }),
    },
  );

  return rows[0]?.balance ?? null;
}

export async function refundServiceCredits(userId: string, jobId: string) {
  const rows = await adminRequest<BalanceRow[]>("rpc/refund_service_job", {
    method: "POST",
    body: JSON.stringify({ p_user_id: userId, p_job_id: jobId }),
  });

  return rows[0]?.balance ?? null;
}

