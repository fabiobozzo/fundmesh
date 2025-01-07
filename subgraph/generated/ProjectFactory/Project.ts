// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt,
} from "@graphprotocol/graph-ts";

export class ContributionMade extends ethereum.Event {
  get params(): ContributionMade__Params {
    return new ContributionMade__Params(this);
  }
}

export class ContributionMade__Params {
  _event: ContributionMade;

  constructor(event: ContributionMade) {
    this._event = event;
  }

  get contributor(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get amount(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get currentBalance(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get contributorsCount(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get timestamp(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }
}

export class Project__getRewardResult {
  value0: BigInt;
  value1: string;

  constructor(value0: BigInt, value1: string) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromUnsignedBigInt(this.value0));
    map.set("value1", ethereum.Value.fromString(this.value1));
    return map;
  }

  getValue0(): BigInt {
    return this.value0;
  }

  getValue1(): string {
    return this.value1;
  }
}

export class Project__getSummaryResult {
  value0: BigInt;
  value1: Address;
  value2: string;
  value3: BigInt;
  value4: BigInt;
  value5: BigInt;
  value6: BigInt;
  value7: boolean;
  value8: BigInt;
  value9: BigInt;
  value10: boolean;
  value11: BigInt;

  constructor(
    value0: BigInt,
    value1: Address,
    value2: string,
    value3: BigInt,
    value4: BigInt,
    value5: BigInt,
    value6: BigInt,
    value7: boolean,
    value8: BigInt,
    value9: BigInt,
    value10: boolean,
    value11: BigInt,
  ) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
    this.value4 = value4;
    this.value5 = value5;
    this.value6 = value6;
    this.value7 = value7;
    this.value8 = value8;
    this.value9 = value9;
    this.value10 = value10;
    this.value11 = value11;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromUnsignedBigInt(this.value0));
    map.set("value1", ethereum.Value.fromAddress(this.value1));
    map.set("value2", ethereum.Value.fromString(this.value2));
    map.set("value3", ethereum.Value.fromUnsignedBigInt(this.value3));
    map.set("value4", ethereum.Value.fromUnsignedBigInt(this.value4));
    map.set("value5", ethereum.Value.fromUnsignedBigInt(this.value5));
    map.set("value6", ethereum.Value.fromUnsignedBigInt(this.value6));
    map.set("value7", ethereum.Value.fromBoolean(this.value7));
    map.set("value8", ethereum.Value.fromUnsignedBigInt(this.value8));
    map.set("value9", ethereum.Value.fromUnsignedBigInt(this.value9));
    map.set("value10", ethereum.Value.fromBoolean(this.value10));
    map.set("value11", ethereum.Value.fromUnsignedBigInt(this.value11));
    return map;
  }

  getValue0(): BigInt {
    return this.value0;
  }

  getValue1(): Address {
    return this.value1;
  }

  getValue2(): string {
    return this.value2;
  }

  getValue3(): BigInt {
    return this.value3;
  }

  getValue4(): BigInt {
    return this.value4;
  }

  getValue5(): BigInt {
    return this.value5;
  }

  getValue6(): BigInt {
    return this.value6;
  }

  getValue7(): boolean {
    return this.value7;
  }

  getValue8(): BigInt {
    return this.value8;
  }

  getValue9(): BigInt {
    return this.value9;
  }

  getValue10(): boolean {
    return this.value10;
  }

  getValue11(): BigInt {
    return this.value11;
  }
}

export class Project__milestoneStatusesResult {
  value0: boolean;
  value1: BigInt;
  value2: BigInt;
  value3: boolean;
  value4: BigInt;

  constructor(
    value0: boolean,
    value1: BigInt,
    value2: BigInt,
    value3: boolean,
    value4: BigInt,
  ) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
    this.value4 = value4;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromBoolean(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    map.set("value2", ethereum.Value.fromUnsignedBigInt(this.value2));
    map.set("value3", ethereum.Value.fromBoolean(this.value3));
    map.set("value4", ethereum.Value.fromUnsignedBigInt(this.value4));
    return map;
  }

  getApproved(): boolean {
    return this.value0;
  }

  getApprovedAt(): BigInt {
    return this.value1;
  }

  getApprovalsCount(): BigInt {
    return this.value2;
  }

  getCompleted(): boolean {
    return this.value3;
  }

  getCompletedAt(): BigInt {
    return this.value4;
  }
}

export class Project__milestonesResult {
  value0: Address;
  value1: string;
  value2: BigInt;

  constructor(value0: Address, value1: string, value2: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromAddress(this.value0));
    map.set("value1", ethereum.Value.fromString(this.value1));
    map.set("value2", ethereum.Value.fromUnsignedBigInt(this.value2));
    return map;
  }

  getRecipient(): Address {
    return this.value0;
  }

  getDescription(): string {
    return this.value1;
  }

  getThreshold(): BigInt {
    return this.value2;
  }
}

export class Project__statusResult {
  value0: boolean;
  value1: BigInt;
  value2: BigInt;
  value3: boolean;
  value4: BigInt;

  constructor(
    value0: boolean,
    value1: BigInt,
    value2: BigInt,
    value3: boolean,
    value4: BigInt,
  ) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
    this.value4 = value4;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromBoolean(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    map.set("value2", ethereum.Value.fromUnsignedBigInt(this.value2));
    map.set("value3", ethereum.Value.fromBoolean(this.value3));
    map.set("value4", ethereum.Value.fromUnsignedBigInt(this.value4));
    return map;
  }

  getApproved(): boolean {
    return this.value0;
  }

  getApprovedAt(): BigInt {
    return this.value1;
  }

  getApprovalsCount(): BigInt {
    return this.value2;
  }

  getCompleted(): boolean {
    return this.value3;
  }

  getCompletedAt(): BigInt {
    return this.value4;
  }
}

export class Project extends ethereum.SmartContract {
  static bind(address: Address): Project {
    return new Project("Project", address);
  }

  cid(): string {
    let result = super.call("cid", "cid():(string)", []);

    return result[0].toString();
  }

  try_cid(): ethereum.CallResult<string> {
    let result = super.tryCall("cid", "cid():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  contributors(param0: Address): BigInt {
    let result = super.call("contributors", "contributors(address):(uint256)", [
      ethereum.Value.fromAddress(param0),
    ]);

    return result[0].toBigInt();
  }

  try_contributors(param0: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "contributors",
      "contributors(address):(uint256)",
      [ethereum.Value.fromAddress(param0)],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  contributorsCount(): BigInt {
    let result = super.call(
      "contributorsCount",
      "contributorsCount():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_contributorsCount(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "contributorsCount",
      "contributorsCount():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  deadline(): BigInt {
    let result = super.call("deadline", "deadline():(uint256)", []);

    return result[0].toBigInt();
  }

  try_deadline(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("deadline", "deadline():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getApproval(_address: Address): BigInt {
    let result = super.call("getApproval", "getApproval(address):(uint256)", [
      ethereum.Value.fromAddress(_address),
    ]);

    return result[0].toBigInt();
  }

  try_getApproval(_address: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getApproval",
      "getApproval(address):(uint256)",
      [ethereum.Value.fromAddress(_address)],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getContribution(_address: Address): BigInt {
    let result = super.call(
      "getContribution",
      "getContribution(address):(uint256)",
      [ethereum.Value.fromAddress(_address)],
    );

    return result[0].toBigInt();
  }

  try_getContribution(_address: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getContribution",
      "getContribution(address):(uint256)",
      [ethereum.Value.fromAddress(_address)],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getMilestonesCount(): BigInt {
    let result = super.call(
      "getMilestonesCount",
      "getMilestonesCount():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_getMilestonesCount(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getMilestonesCount",
      "getMilestonesCount():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getReward(_address: Address): Project__getRewardResult {
    let result = super.call(
      "getReward",
      "getReward(address):(uint256,string)",
      [ethereum.Value.fromAddress(_address)],
    );

    return new Project__getRewardResult(
      result[0].toBigInt(),
      result[1].toString(),
    );
  }

  try_getReward(
    _address: Address,
  ): ethereum.CallResult<Project__getRewardResult> {
    let result = super.tryCall(
      "getReward",
      "getReward(address):(uint256,string)",
      [ethereum.Value.fromAddress(_address)],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new Project__getRewardResult(value[0].toBigInt(), value[1].toString()),
    );
  }

  getSummary(): Project__getSummaryResult {
    let result = super.call(
      "getSummary",
      "getSummary():(uint256,address,string,uint256,uint256,uint256,uint256,bool,uint256,uint256,bool,uint256)",
      [],
    );

    return new Project__getSummaryResult(
      result[0].toBigInt(),
      result[1].toAddress(),
      result[2].toString(),
      result[3].toBigInt(),
      result[4].toBigInt(),
      result[5].toBigInt(),
      result[6].toBigInt(),
      result[7].toBoolean(),
      result[8].toBigInt(),
      result[9].toBigInt(),
      result[10].toBoolean(),
      result[11].toBigInt(),
    );
  }

  try_getSummary(): ethereum.CallResult<Project__getSummaryResult> {
    let result = super.tryCall(
      "getSummary",
      "getSummary():(uint256,address,string,uint256,uint256,uint256,uint256,bool,uint256,uint256,bool,uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new Project__getSummaryResult(
        value[0].toBigInt(),
        value[1].toAddress(),
        value[2].toString(),
        value[3].toBigInt(),
        value[4].toBigInt(),
        value[5].toBigInt(),
        value[6].toBigInt(),
        value[7].toBoolean(),
        value[8].toBigInt(),
        value[9].toBigInt(),
        value[10].toBoolean(),
        value[11].toBigInt(),
      ),
    );
  }

  milestoneStatuses(param0: BigInt): Project__milestoneStatusesResult {
    let result = super.call(
      "milestoneStatuses",
      "milestoneStatuses(uint256):(bool,uint256,uint256,bool,uint256)",
      [ethereum.Value.fromUnsignedBigInt(param0)],
    );

    return new Project__milestoneStatusesResult(
      result[0].toBoolean(),
      result[1].toBigInt(),
      result[2].toBigInt(),
      result[3].toBoolean(),
      result[4].toBigInt(),
    );
  }

  try_milestoneStatuses(
    param0: BigInt,
  ): ethereum.CallResult<Project__milestoneStatusesResult> {
    let result = super.tryCall(
      "milestoneStatuses",
      "milestoneStatuses(uint256):(bool,uint256,uint256,bool,uint256)",
      [ethereum.Value.fromUnsignedBigInt(param0)],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new Project__milestoneStatusesResult(
        value[0].toBoolean(),
        value[1].toBigInt(),
        value[2].toBigInt(),
        value[3].toBoolean(),
        value[4].toBigInt(),
      ),
    );
  }

  milestones(param0: BigInt): Project__milestonesResult {
    let result = super.call(
      "milestones",
      "milestones(uint256):(address,string,uint256)",
      [ethereum.Value.fromUnsignedBigInt(param0)],
    );

    return new Project__milestonesResult(
      result[0].toAddress(),
      result[1].toString(),
      result[2].toBigInt(),
    );
  }

  try_milestones(
    param0: BigInt,
  ): ethereum.CallResult<Project__milestonesResult> {
    let result = super.tryCall(
      "milestones",
      "milestones(uint256):(address,string,uint256)",
      [ethereum.Value.fromUnsignedBigInt(param0)],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new Project__milestonesResult(
        value[0].toAddress(),
        value[1].toString(),
        value[2].toBigInt(),
      ),
    );
  }

  minimumContribution(): BigInt {
    let result = super.call(
      "minimumContribution",
      "minimumContribution():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_minimumContribution(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "minimumContribution",
      "minimumContribution():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  nft(): Address {
    let result = super.call("nft", "nft():(address)", []);

    return result[0].toAddress();
  }

  try_nft(): ethereum.CallResult<Address> {
    let result = super.tryCall("nft", "nft():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  owner(): Address {
    let result = super.call("owner", "owner():(address)", []);

    return result[0].toAddress();
  }

  try_owner(): ethereum.CallResult<Address> {
    let result = super.tryCall("owner", "owner():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  recipient(): Address {
    let result = super.call("recipient", "recipient():(address)", []);

    return result[0].toAddress();
  }

  try_recipient(): ethereum.CallResult<Address> {
    let result = super.tryCall("recipient", "recipient():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  status(): Project__statusResult {
    let result = super.call(
      "status",
      "status():(bool,uint256,uint256,bool,uint256)",
      [],
    );

    return new Project__statusResult(
      result[0].toBoolean(),
      result[1].toBigInt(),
      result[2].toBigInt(),
      result[3].toBoolean(),
      result[4].toBigInt(),
    );
  }

  try_status(): ethereum.CallResult<Project__statusResult> {
    let result = super.tryCall(
      "status",
      "status():(bool,uint256,uint256,bool,uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new Project__statusResult(
        value[0].toBoolean(),
        value[1].toBigInt(),
        value[2].toBigInt(),
        value[3].toBoolean(),
        value[4].toBigInt(),
      ),
    );
  }

  targetContribution(): BigInt {
    let result = super.call(
      "targetContribution",
      "targetContribution():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_targetContribution(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "targetContribution",
      "targetContribution():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _id(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _owner(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _recipient(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _cid(): string {
    return this._call.inputValues[3].value.toString();
  }

  get _minimumContribution(): BigInt {
    return this._call.inputValues[4].value.toBigInt();
  }

  get _targetContribution(): BigInt {
    return this._call.inputValues[5].value.toBigInt();
  }

  get _deadline(): BigInt {
    return this._call.inputValues[6].value.toBigInt();
  }

  get nftNamePrefix(): string {
    return this._call.inputValues[7].value.toString();
  }

  get nftSymbolPrefix(): string {
    return this._call.inputValues[8].value.toString();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ApproveCall extends ethereum.Call {
  get inputs(): ApproveCall__Inputs {
    return new ApproveCall__Inputs(this);
  }

  get outputs(): ApproveCall__Outputs {
    return new ApproveCall__Outputs(this);
  }
}

export class ApproveCall__Inputs {
  _call: ApproveCall;

  constructor(call: ApproveCall) {
    this._call = call;
  }
}

export class ApproveCall__Outputs {
  _call: ApproveCall;

  constructor(call: ApproveCall) {
    this._call = call;
  }
}

export class ApproveMilestoneCall extends ethereum.Call {
  get inputs(): ApproveMilestoneCall__Inputs {
    return new ApproveMilestoneCall__Inputs(this);
  }

  get outputs(): ApproveMilestoneCall__Outputs {
    return new ApproveMilestoneCall__Outputs(this);
  }
}

export class ApproveMilestoneCall__Inputs {
  _call: ApproveMilestoneCall;

  constructor(call: ApproveMilestoneCall) {
    this._call = call;
  }

  get index(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class ApproveMilestoneCall__Outputs {
  _call: ApproveMilestoneCall;

  constructor(call: ApproveMilestoneCall) {
    this._call = call;
  }
}

export class ContributeCall extends ethereum.Call {
  get inputs(): ContributeCall__Inputs {
    return new ContributeCall__Inputs(this);
  }

  get outputs(): ContributeCall__Outputs {
    return new ContributeCall__Outputs(this);
  }
}

export class ContributeCall__Inputs {
  _call: ContributeCall;

  constructor(call: ContributeCall) {
    this._call = call;
  }
}

export class ContributeCall__Outputs {
  _call: ContributeCall;

  constructor(call: ContributeCall) {
    this._call = call;
  }
}

export class CreateMilestoneCall extends ethereum.Call {
  get inputs(): CreateMilestoneCall__Inputs {
    return new CreateMilestoneCall__Inputs(this);
  }

  get outputs(): CreateMilestoneCall__Outputs {
    return new CreateMilestoneCall__Outputs(this);
  }
}

export class CreateMilestoneCall__Inputs {
  _call: CreateMilestoneCall;

  constructor(call: CreateMilestoneCall) {
    this._call = call;
  }

  get _description(): string {
    return this._call.inputValues[0].value.toString();
  }

  get _threshold(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _recipient(): Address {
    return this._call.inputValues[2].value.toAddress();
  }
}

export class CreateMilestoneCall__Outputs {
  _call: CreateMilestoneCall;

  constructor(call: CreateMilestoneCall) {
    this._call = call;
  }
}

export class CreateMilestonesCall extends ethereum.Call {
  get inputs(): CreateMilestonesCall__Inputs {
    return new CreateMilestonesCall__Inputs(this);
  }

  get outputs(): CreateMilestonesCall__Outputs {
    return new CreateMilestonesCall__Outputs(this);
  }
}

export class CreateMilestonesCall__Inputs {
  _call: CreateMilestonesCall;

  constructor(call: CreateMilestonesCall) {
    this._call = call;
  }

  get descriptions(): Array<string> {
    return this._call.inputValues[0].value.toStringArray();
  }

  get thresholds(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }

  get recipients(): Array<Address> {
    return this._call.inputValues[2].value.toAddressArray();
  }
}

export class CreateMilestonesCall__Outputs {
  _call: CreateMilestonesCall;

  constructor(call: CreateMilestonesCall) {
    this._call = call;
  }
}

export class RewardCall extends ethereum.Call {
  get inputs(): RewardCall__Inputs {
    return new RewardCall__Inputs(this);
  }

  get outputs(): RewardCall__Outputs {
    return new RewardCall__Outputs(this);
  }
}

export class RewardCall__Inputs {
  _call: RewardCall;

  constructor(call: RewardCall) {
    this._call = call;
  }

  get tokenURI(): string {
    return this._call.inputValues[0].value.toString();
  }
}

export class RewardCall__Outputs {
  _call: RewardCall;

  constructor(call: RewardCall) {
    this._call = call;
  }
}

export class WithdrawCall extends ethereum.Call {
  get inputs(): WithdrawCall__Inputs {
    return new WithdrawCall__Inputs(this);
  }

  get outputs(): WithdrawCall__Outputs {
    return new WithdrawCall__Outputs(this);
  }
}

export class WithdrawCall__Inputs {
  _call: WithdrawCall;

  constructor(call: WithdrawCall) {
    this._call = call;
  }
}

export class WithdrawCall__Outputs {
  _call: WithdrawCall;

  constructor(call: WithdrawCall) {
    this._call = call;
  }
}

export class WithdrawMilestoneCall extends ethereum.Call {
  get inputs(): WithdrawMilestoneCall__Inputs {
    return new WithdrawMilestoneCall__Inputs(this);
  }

  get outputs(): WithdrawMilestoneCall__Outputs {
    return new WithdrawMilestoneCall__Outputs(this);
  }
}

export class WithdrawMilestoneCall__Inputs {
  _call: WithdrawMilestoneCall;

  constructor(call: WithdrawMilestoneCall) {
    this._call = call;
  }

  get index(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class WithdrawMilestoneCall__Outputs {
  _call: WithdrawMilestoneCall;

  constructor(call: WithdrawMilestoneCall) {
    this._call = call;
  }
}
