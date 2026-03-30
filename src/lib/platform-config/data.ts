import "server-only";

import { prisma } from "@/lib/prisma";
import { PLATFORM_CONFIG_ROW_ID } from "./constants";

export type PlatformConfigDTO = {
  displayName: string;
  supportEmail: string | null;
  noticeBanner: string | null;
};

export async function getPlatformConfig(): Promise<PlatformConfigDTO | null> {
  const row = await prisma.platformConfig.findUnique({
    where: { id: PLATFORM_CONFIG_ROW_ID },
    select: {
      displayName: true,
      supportEmail: true,
      noticeBanner: true,
    },
  });
  return row;
}
