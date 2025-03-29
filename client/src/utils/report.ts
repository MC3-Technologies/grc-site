type QuestionAnswer = {
  question: string;
  answer: string;
};

type ControlResult = {
  control:string,
  score: number;
  maxScorePossible: number;
  questionsAnswered: QuestionAnswer[];
};

type ReportResult = {
  score:number
  controlResults: ControlResult[];
};

class Report<T> {
  private _assessmentData: T;

  constructor(assessmentData: T) {
    if (typeof assessmentData !== "object" || assessmentData === null) {
      throw new Error("Assessment data is not an object or is null!");
    }

    this._assessmentData = assessmentData;
  }

  public printData = (): void => {
    for (const key in this._assessmentData) {
      if (Object.prototype.hasOwnProperty.call(this._assessmentData, key)) {
        console.log(`${key}: ${this._assessmentData[key]}`);
      }
    }
  };

  private _getAccessControlResult = ():ControlResult=>{
    for (const key in this._assessmentData) {
      if (Object.prototype.hasOwnProperty.call(this._assessmentData, "AC.L1-b")) {
        console.log(`${key}: ${this._assessmentData[key]}`);
      }
    }
    
  }

  public generateReportData = ():ReportResult=>{

  }
}

export { Report };