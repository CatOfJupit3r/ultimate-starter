import { achievementsService } from '@~/services/achievements.service';

export default async function achievementsLoader() {
  achievementsService.initialize();
}
