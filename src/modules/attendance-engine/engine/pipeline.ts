import { PunchContext } from "./context";

export interface PunchStage {
  execute(context: PunchContext): Promise<void>;
}

export class PunchPipeline {
  private stages: PunchStage[];

  constructor(stages: PunchStage[]) {
    this.stages = stages;
  }

  async run(context: PunchContext): Promise<void> {
    for (const stage of this.stages) {
      await stage.execute(context);
      if (context.isIdempotentRepeat) {
        // Stop execution immediately if duplicate idempotent repeat is detected
        break;
      }
    }
  }
}
