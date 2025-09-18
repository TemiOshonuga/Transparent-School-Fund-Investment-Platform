import { describe, it, expect, beforeEach } from "vitest";
import { stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_MAX_DEPOSIT = 101;
const ERR_INVALID_MIN_WITHDRAW = 102;
const ERR_INVALID_LOCK_PERIOD = 103;
const ERR_INVALID_PENALTY_RATE = 104;
const ERR_INVALID_APPROVAL_THRESH = 105;
const ERR_VAULT_ALREADY_EXISTS = 106;
const ERR_INVALID_VAULT_TYPE = 115;
const ERR_INVALID_INTEREST_RATE = 116;
const ERR_INVALID_GRACE_PERIOD = 117;
const ERR_INVALID_LOCATION = 118;
const ERR_INVALID_CURRENCY = 119;
const ERR_INVALID_MIN_DEPOSIT = 110;
const ERR_INVALID_MAX_WITHDRAW = 111;
const ERR_MAX_VAULTS_EXCEEDED = 114;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_AUTHORITY_NOT_VERIFIED = 109;
const ERR_INSUFFICIENT_BALANCE = 121;
const ERR_LOCK_PERIOD_NOT_EXPIRED = 122;
const ERR_INVALID_AMOUNT = 123;
const ERR_INVALID_RECIPIENT = 124;
const ERR_DEPOSIT_EXCEEDS_MAX = 125;
const ERR_WITHDRAW_BELOW_MIN = 126;

interface Vault {
  name: string;
  maxDeposit: number;
  minWithdraw: number;
  lockPeriod: number;
  penaltyRate: number;
  approvalThresh: number;
  timestamp: number;
  creator: string;
  vaultType: string;
  interestRate: number;
  gracePeriod: number;
  location: string;
  currency: string;
  status: boolean;
  minDeposit: number;
  maxWithdraw: number;
  totalBalance: number;
}

interface VaultUpdate {
  updateName: string;
  updateMaxDeposit: number;
  updateMinWithdraw: number;
  updateTimestamp: number;
  updater: string;
}

interface DepositLog {
  amount: number;
  timestamp: number;
}

interface WithdrawalLog {
  amount: number;
  timestamp: number;
  penalty: number;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class FundVaultMock {
  state: {
    nextVaultId: number;
    maxVaults: number;
    creationFee: number;
    authorityContract: string | null;
    vaults: Map<number, Vault>;
    vaultUpdates: Map<number, VaultUpdate>;
    vaultsByName: Map<string, number>;
    depositLogs: Map<string, DepositLog>;
    withdrawalLogs: Map<string, WithdrawalLog>;
  } = {
    nextVaultId: 0,
    maxVaults: 1000,
    creationFee: 1000,
    authorityContract: null,
    vaults: new Map(),
    vaultUpdates: new Map(),
    vaultsByName: new Map(),
    depositLogs: new Map(),
    withdrawalLogs: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  authorities: Set<string> = new Set(["ST1TEST"]);
  stxTransfers: Array<{ amount: number; from: string | null; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextVaultId: 0,
      maxVaults: 1000,
      creationFee: 1000,
      authorityContract: null,
      vaults: new Map(),
      vaultUpdates: new Map(),
      vaultsByName: new Map(),
      depositLogs: new Map(),
      withdrawalLogs: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorities = new Set(["ST1TEST"]);
    this.stxTransfers = [];
  }

  isVerifiedAuthority(principal: string): Result<boolean> {
    return { ok: true, value: this.authorities.has(principal) };
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setCreationFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.creationFee = newFee;
    return { ok: true, value: true };
  }

  createVault(
    name: string,
    maxDeposit: number,
    minWithdraw: number,
    lockPeriod: number,
    penaltyRate: number,
    approvalThresh: number,
    vaultType: string,
    interestRate: number,
    gracePeriod: number,
    location: string,
    currency: string,
    minDeposit: number,
    maxWithdraw: number
  ): Result<number> {
    if (this.state.nextVaultId >= this.state.maxVaults) return { ok: false, value: ERR_MAX_VAULTS_EXCEEDED };
    if (!name || name.length > 100) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    if (maxDeposit <= 0 || maxDeposit > 1000000000) return { ok: false, value: ERR_INVALID_MAX_DEPOSIT };
    if (minWithdraw <= 0) return { ok: false, value: ERR_INVALID_MIN_WITHDRAW };
    if (lockPeriod <= 0) return { ok: false, value: ERR_INVALID_LOCK_PERIOD };
    if (penaltyRate > 100) return { ok: false, value: ERR_INVALID_PENALTY_RATE };
    if (approvalThresh <= 0 || approvalThresh > 100) return { ok: false, value: ERR_INVALID_APPROVAL_THRESH };
    if (!["school", "community", "endowment"].includes(vaultType)) return { ok: false, value: ERR_INVALID_VAULT_TYPE };
    if (interestRate > 20) return { ok: false, value: ERR_INVALID_INTEREST_RATE };
    if (gracePeriod > 30) return { ok: false, value: ERR_INVALID_GRACE_PERIOD };
    if (!location || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!["STX", "USD", "BTC"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (minDeposit <= 0) return { ok: false, value: ERR_INVALID_MIN_DEPOSIT };
    if (maxWithdraw <= 0) return { ok: false, value: ERR_INVALID_MAX_WITHDRAW };
    if (!this.isVerifiedAuthority(this.caller).value) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (this.state.vaultsByName.has(name)) return { ok: false, value: ERR_VAULT_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({ amount: this.state.creationFee, from: this.caller, to: this.state.authorityContract });

    const id = this.state.nextVaultId;
    const vault: Vault = {
      name,
      maxDeposit,
      minWithdraw,
      lockPeriod,
      penaltyRate,
      approvalThresh,
      timestamp: this.blockHeight,
      creator: this.caller,
      vaultType,
      interestRate,
      gracePeriod,
      location,
      currency,
      status: true,
      minDeposit,
      maxWithdraw,
      totalBalance: 0,
    };
    this.state.vaults.set(id, vault);
    this.state.vaultsByName.set(name, id);
    this.state.nextVaultId++;
    return { ok: true, value: id };
  }

  getVault(id: number): Vault | null {
    return this.state.vaults.get(id) || null;
  }

  updateVault(id: number, updateName: string, updateMaxDeposit: number, updateMinWithdraw: number): Result<boolean | number> {
    const vault = this.state.vaults.get(id);
    if (!vault) return { ok: false, value: ERR_VAULT_NOT_FOUND };
    if (vault.creator !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!updateName || updateName.length > 100) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    if (updateMaxDeposit <= 0 || updateMaxDeposit > 1000000000) return { ok: false, value: ERR_INVALID_MAX_DEPOSIT };
    if (updateMinWithdraw <= 0) return { ok: false, value: ERR_INVALID_MIN_WITHDRAW };
    if (this.state.vaultsByName.has(updateName) && this.state.vaultsByName.get(updateName) !== id) {
      return { ok: false, value: ERR_VAULT_ALREADY_EXISTS };
    }

    const updated: Vault = {
      ...vault,
      name: updateName,
      maxDeposit: updateMaxDeposit,
      minWithdraw: updateMinWithdraw,
      timestamp: this.blockHeight,
    };
    this.state.vaults.set(id, updated);
    this.state.vaultsByName.delete(vault.name);
    this.state.vaultsByName.set(updateName, id);
    this.state.vaultUpdates.set(id, {
      updateName,
      updateMaxDeposit,
      updateMinWithdraw,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  depositToVault(id: number, amount: number): Result<boolean | number> {
    const vault = this.state.vaults.get(id);
    if (!vault) return { ok: false, value: ERR_VAULT_NOT_FOUND };
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (amount < vault.minDeposit) return { ok: false, value: ERR_INVALID_MIN_DEPOSIT };
    if (amount > vault.maxDeposit) return { ok: false, value: ERR_DEPOSIT_EXCEEDS_MAX };
    if (!vault.status) return { ok: false, value: ERR_INVALID_STATUS };

    const updatedVault: Vault = { ...vault, totalBalance: vault.totalBalance + amount };
    this.state.vaults.set(id, updatedVault);
    const depositKey = `${id}-${this.caller}`;
    this.state.depositLogs.set(depositKey, { amount, timestamp: this.blockHeight });
    this.stxTransfers.push({ amount, from: this.caller, to: null });
    return { ok: true, value: true };
  }

  withdrawFromVault(id: number, amount: number, recipient: string): Result<boolean | number> {
    const vault = this.state.vaults.get(id);
    if (!vault) return { ok: false, value: ERR_VAULT_NOT_FOUND };
    const depositKey = `${id}-${this.caller}`;
    const depositLog = this.state.depositLogs.get(depositKey);
    if (!depositLog) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (recipient === this.caller) return { ok: false, value: ERR_INVALID_RECIPIENT };
    if (amount < vault.minWithdraw) return { ok: false, value: ERR_WITHDRAW_BELOW_MIN };
    if (amount > vault.maxWithdraw) return { ok: false, value: ERR_INVALID_MAX_WITHDRAW };
    if (vault.totalBalance < amount) return { ok: false, value: ERR_INSUFFICIENT_BALANCE };
    if (!vault.status) return { ok: false, value: ERR_INVALID_STATUS };
    const lockExpiry = depositLog.timestamp + vault.lockPeriod;
    if (this.blockHeight < lockExpiry) return { ok: false, value: ERR_LOCK_PERIOD_NOT_EXPIRED };

    const penalty = 0;
    const updatedVault: Vault = { ...vault, totalBalance: vault.totalBalance - amount };
    this.state.vaults.set(id, updatedVault);
    const withdrawalKey = `${id}-${this.caller}`;
    this.state.withdrawalLogs.set(withdrawalKey, { amount, timestamp: this.blockHeight, penalty });
    this.stxTransfers.push({ amount, from: null, to: recipient });
    return { ok: true, value: true };
  }

  getVaultCount(): Result<number> {
    return { ok: true, value: this.state.nextVaultId };
  }

  checkVaultExistence(name: string): Result<boolean> {
    return { ok: true, value: this.state.vaultsByName.has(name) };
  }
}

describe("FundVault", () => {
  let contract: FundVaultMock;

  beforeEach(() => {
    contract = new FundVaultMock();
    contract.reset();
  });

  it("creates a vault successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createVault(
      "Alpha",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const vault = contract.getVault(0);
    expect(vault?.name).toBe("Alpha");
    expect(vault?.maxDeposit).toBe(1000000);
    expect(vault?.minWithdraw).toBe(100);
    expect(vault?.lockPeriod).toBe(30);
    expect(vault?.penaltyRate).toBe(5);
    expect(vault?.approvalThresh).toBe(50);
    expect(vault?.vaultType).toBe("school");
    expect(vault?.interestRate).toBe(10);
    expect(vault?.gracePeriod).toBe(7);
    expect(vault?.location).toBe("SchoolX");
    expect(vault?.currency).toBe("STX");
    expect(vault?.minDeposit).toBe(50);
    expect(vault?.maxWithdraw).toBe(500000);
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects duplicate vault names", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "Alpha",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    const result = contract.createVault(
      "Alpha",
      2000000,
      200,
      60,
      10,
      60,
      "community",
      15,
      14,
      "CommY",
      "USD",
      100,
      1000000
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VAULT_ALREADY_EXISTS);
  });

  it("rejects non-authorized caller", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.caller = "ST2FAKE";
    contract.authorities = new Set();
    const result = contract.createVault(
      "Beta",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("parses vault name with Clarity", () => {
    const cv = stringUtf8CV("Gamma");
    expect(cv.value).toBe("Gamma");
  });

  it("rejects vault creation without authority contract", () => {
    const result = contract.createVault(
      "NoAuth",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects invalid max deposit", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createVault(
      "InvalidDeposit",
      1000000001,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MAX_DEPOSIT);
  });

  it("rejects invalid min withdraw", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createVault(
      "InvalidWithdraw",
      1000000,
      0,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MIN_WITHDRAW);
  });

  it("rejects invalid vault type", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createVault(
      "InvalidType",
      1000000,
      100,
      30,
      5,
      50,
      "invalid",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_VAULT_TYPE);
  });

  it("updates a vault successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "OldVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    const result = contract.updateVault(0, "NewVault", 1500000, 150);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const vault = contract.getVault(0);
    expect(vault?.name).toBe("NewVault");
    expect(vault?.maxDeposit).toBe(1500000);
    expect(vault?.minWithdraw).toBe(150);
    const update = contract.state.vaultUpdates.get(0);
    expect(update?.updateName).toBe("NewVault");
    expect(update?.updateMaxDeposit).toBe(1500000);
    expect(update?.updateMinWithdraw).toBe(150);
    expect(update?.updater).toBe("ST1TEST");
  });

  it("rejects update by non-creator", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "TestVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    contract.caller = "ST3FAKE";
    const result = contract.updateVault(0, "NewVault", 1500000, 150);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("sets creation fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setCreationFee(2000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.creationFee).toBe(2000);
    contract.createVault(
      "TestVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    expect(contract.stxTransfers).toEqual([{ amount: 2000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects creation fee change without authority contract", () => {
    const result = contract.setCreationFee(2000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("returns correct vault count", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "Vault1",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    contract.createVault(
      "Vault2",
      2000000,
      200,
      60,
      10,
      60,
      "community",
      15,
      14,
      "CommY",
      "USD",
      100,
      1000000
    );
    const result = contract.getVaultCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("checks vault existence correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "TestVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    const result = contract.checkVaultExistence("TestVault");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const result2 = contract.checkVaultExistence("NonExistent");
    expect(result2.ok).toBe(true);
    expect(result2.value).toBe(false);
  });

  it("parses vault parameters with Clarity types", () => {
    const name = stringUtf8CV("TestVault");
    const maxDeposit = uintCV(1000000);
    const minWithdraw = uintCV(100);
    expect(name.value).toBe("TestVault");
    expect(maxDeposit.value).toEqual(BigInt(1000000));
    expect(minWithdraw.value).toEqual(BigInt(100));
  });

  it("rejects vault creation with empty name", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createVault(
      "",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_UPDATE_PARAM);
  });

  it("rejects vault creation with max vaults exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxVaults = 1;
    contract.createVault(
      "Vault1",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    const result = contract.createVault(
      "Vault2",
      2000000,
      200,
      60,
      10,
      60,
      "community",
      15,
      14,
      "CommY",
      "USD",
      100,
      1000000
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_VAULTS_EXCEEDED);
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });

  it("rejects invalid authority contract", () => {
    const result = contract.setAuthorityContract("SP000000000000000000002Q6VF78");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("deposits to vault successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "TestVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    const result = contract.depositToVault(0, 1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const vault = contract.getVault(0);
    expect(vault?.totalBalance).toBe(1000);
    const depositKey = `0-${contract.caller}`;
    const depositLog = contract.state.depositLogs.get(depositKey);
    expect(depositLog?.amount).toBe(1000);
    expect(depositLog?.timestamp).toBe(0);
  });

  it("rejects deposit below min deposit", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "TestVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    const result = contract.depositToVault(0, 49);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MIN_DEPOSIT);
  });

  it("withdraws from vault successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "TestVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    contract.depositToVault(0, 1000);
    contract.blockHeight = 31;
    const result = contract.withdrawFromVault(0, 500, "ST4RECIP");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const vault = contract.getVault(0);
    expect(vault?.totalBalance).toBe(500);
    const withdrawalKey = `0-${contract.caller}`;
    const withdrawalLog = contract.state.withdrawalLogs.get(withdrawalKey);
    expect(withdrawalLog?.amount).toBe(500);
    expect(withdrawalLog?.timestamp).toBe(31);
    expect(withdrawalLog?.penalty).toBe(0);
  });

  it("rejects withdrawal before lock period expires", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "TestVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    contract.depositToVault(0, 1000);
    contract.blockHeight = 29;
    const result = contract.withdrawFromVault(0, 500, "ST4RECIP");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_LOCK_PERIOD_NOT_EXPIRED);
  });

  it("rejects withdrawal with insufficient balance", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createVault(
      "TestVault",
      1000000,
      100,
      30,
      5,
      50,
      "school",
      10,
      7,
      "SchoolX",
      "STX",
      50,
      500000
    );
    contract.depositToVault(0, 1000);
    contract.blockHeight = 31;
    const result = contract.withdrawFromVault(0, 1500, "ST4RECIP");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INSUFFICIENT_BALANCE);
  });
});