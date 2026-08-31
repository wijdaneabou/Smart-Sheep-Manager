import {
  findLoyaltyProfileByClientId,
  createLoyaltyProfile as createLoyaltyProfileInDb,
  updateLoyaltyProfile as updateLoyaltyProfileInDb,
  listLoyaltyProfiles as listLoyaltyProfilesInDb,
} from "../repositories/loyalty.repository.js";

export async function getOrCreateLoyaltyProfile(clientId: number) {
  let profile = await findLoyaltyProfileByClientId(clientId);
  if (!profile) {
    profile = await createLoyaltyProfileInDb({ clientId });
  }
  return profile;
}

export async function listLoyaltyProfiles(params: {
  page: number;
  limit: number;
  search?: string;
  segmentId?: number;
}) {
  const { rows, total } = await listLoyaltyProfilesInDb(params);
  return {
    success: true,
    status: 200,
    profiles: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
