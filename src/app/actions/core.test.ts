import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({
  contactCount:vi.fn(),
  contactFindFirst:vi.fn(),
  debtCreate:vi.fn(),
  transaction:vi.fn(),
  requireUser:vi.fn().mockResolvedValue({id:"user-1"}),
}));

vi.mock("@/lib/db",()=>({db:{
  contact:{count:mocks.contactCount,findFirst:mocks.contactFindFirst},
  debt:{create:mocks.debtCreate},
  $transaction:mocks.transaction,
}}));
vi.mock("@/lib/auth",()=>({requireUser:mocks.requireUser,clearSession:vi.fn(),createSession:vi.fn()}));
vi.mock("@/lib/mentions",()=>({createMentionLinks:vi.fn()}));
vi.mock("@/lib/media",()=>({deleteImage:vi.fn(),saveImage:vi.fn()}));
vi.mock("@/lib/immich",()=>({getImmichPerson:vi.fn(),isImmichConfigured:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:vi.fn()}));
vi.mock("next/headers",()=>({headers:vi.fn()}));

import { addDebt, addGroupInteraction } from "@/app/actions/core";

describe("server action authorization and validation",()=>{
  beforeEach(()=>vi.clearAllMocks());

  it("rejects a group interaction containing a foreign contact",async()=>{
    mocks.contactCount.mockResolvedValue(1);
    const form=new FormData();
    form.append("contactIds","owned");
    form.append("contactIds","foreign");

    await expect(addGroupInteraction(form)).resolves.toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects an invalid debt amount before writing",async()=>{
    mocks.contactFindFirst.mockResolvedValue({id:"contact-1"});
    const form=new FormData();
    form.set("contactId","contact-1");
    form.set("title","Restaurant");
    form.set("amount","not-a-number");

    await expect(addDebt(form)).resolves.toBe(false);
    expect(mocks.debtCreate).not.toHaveBeenCalled();
  });
});
