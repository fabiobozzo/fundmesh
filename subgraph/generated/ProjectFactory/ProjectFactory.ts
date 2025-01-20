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

export class ProjectCreated extends ethereum.Event {
  get params(): ProjectCreated__Params {
    return new ProjectCreated__Params(this);
  }
}

export class ProjectCreated__Params {
  _event: ProjectCreated;

  constructor(event: ProjectCreated) {
    this._event = event;
  }

  get id(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get projectAddress(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get owner(): Address {
    return this._event.parameters[2].value.toAddress();
  }

  get cid(): string {
    return this._event.parameters[3].value.toString();
  }

  get minimumContribution(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get targetContribution(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }

  get deadline(): BigInt {
    return this._event.parameters[6].value.toBigInt();
  }

  get timestamp(): BigInt {
    return this._event.parameters[7].value.toBigInt();
  }
}

export class ProjectFactory extends ethereum.SmartContract {
  static bind(address: Address): ProjectFactory {
    return new ProjectFactory("ProjectFactory", address);
  }

  deployedProjects(param0: BigInt): Address {
    let result = super.call(
      "deployedProjects",
      "deployedProjects(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(param0)],
    );

    return result[0].toAddress();
  }

  try_deployedProjects(param0: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "deployedProjects",
      "deployedProjects(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(param0)],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  getDeployedProjects(): Array<Address> {
    let result = super.call(
      "getDeployedProjects",
      "getDeployedProjects():(address[])",
      [],
    );

    return result[0].toAddressArray();
  }

  try_getDeployedProjects(): ethereum.CallResult<Array<Address>> {
    let result = super.tryCall(
      "getDeployedProjects",
      "getDeployedProjects():(address[])",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddressArray());
  }

  getUserProjects(): Array<Address> {
    let result = super.call(
      "getUserProjects",
      "getUserProjects():(address[])",
      [],
    );

    return result[0].toAddressArray();
  }

  try_getUserProjects(): ethereum.CallResult<Array<Address>> {
    let result = super.tryCall(
      "getUserProjects",
      "getUserProjects():(address[])",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddressArray());
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

  userProjects(param0: Address, param1: BigInt): Address {
    let result = super.call(
      "userProjects",
      "userProjects(address,uint256):(address)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromUnsignedBigInt(param1),
      ],
    );

    return result[0].toAddress();
  }

  try_userProjects(
    param0: Address,
    param1: BigInt,
  ): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "userProjects",
      "userProjects(address,uint256):(address)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromUnsignedBigInt(param1),
      ],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
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
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class CreateProjectCall extends ethereum.Call {
  get inputs(): CreateProjectCall__Inputs {
    return new CreateProjectCall__Inputs(this);
  }

  get outputs(): CreateProjectCall__Outputs {
    return new CreateProjectCall__Outputs(this);
  }
}

export class CreateProjectCall__Inputs {
  _call: CreateProjectCall;

  constructor(call: CreateProjectCall) {
    this._call = call;
  }

  get recipient(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get cid(): string {
    return this._call.inputValues[1].value.toString();
  }

  get minimumContribution(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get targetContribution(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }

  get deadline(): BigInt {
    return this._call.inputValues[4].value.toBigInt();
  }

  get nftNamePrefix(): string {
    return this._call.inputValues[5].value.toString();
  }

  get nftSymbolPrefix(): string {
    return this._call.inputValues[6].value.toString();
  }
}

export class CreateProjectCall__Outputs {
  _call: CreateProjectCall;

  constructor(call: CreateProjectCall) {
    this._call = call;
  }
}
