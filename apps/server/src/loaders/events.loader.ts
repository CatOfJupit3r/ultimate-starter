import { container } from 'tsyringe';

import { UserEventsService } from '@~/features/user/user-events.service';

export default async function eventsLoader() {
  // Resolve and initialize event services (which will register event listeners)
  container.resolve(UserEventsService);
}
