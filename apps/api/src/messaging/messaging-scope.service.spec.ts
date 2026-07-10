import { UserRole } from '@prisma/client';
import { MessagingScopeService } from './messaging-scope.service';

describe('MessagingScopeService', () => {
  const prisma = {} as never;
  const scope = new MessagingScopeService(prisma);

  it('allows managers to start conversations', () => {
    expect(scope.canStartConversation({ role: UserRole.COMPANY_ADMIN } as never)).toBe(true);
    expect(scope.canStartConversation({ role: UserRole.EMPLOYEE } as never)).toBe(false);
  });

  it('allows managers to create groups', () => {
    expect(scope.canCreateGroup({ role: UserRole.BRANCH_MANAGER } as never)).toBe(true);
    expect(scope.canCreateGroup({ role: UserRole.EMPLOYEE } as never)).toBe(false);
  });
});
