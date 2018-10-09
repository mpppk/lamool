export interface IInvokeParams {
  FunctionName: string
  Payload: object
}

export interface IContext {
  functionName: string
}

type Callback = (error: Error | null, result: object) => void
type LambdaFunction = (event: object, context: IContext, callback: Callback) => void

export class Lamool {
  private funcMap = new Map<string, LambdaFunction>();

  public createFunction(name: string, func: LambdaFunction): boolean {
    if (this.funcMap.has(name)) {
      return false;
    }
    this.funcMap.set(name, func);
    return true
  }

  public invoke(params: IInvokeParams, callback: Callback) {
    if (!this.funcMap.has(params.FunctionName)) {
      throw new Error("function not found");
    }
    const func = this.funcMap.get(params.FunctionName)!;
    func(params.Payload, {functionName: params.FunctionName}, callback);
  }
}

