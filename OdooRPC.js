class OdooRPC {
  constructor(url, db, context) {
    this.url = url;
    this.db = db;
    this.sessionId = null;
    this.uid = null;
    this.context = context;
  }

  async authenticate() {
    try {
      const sessionInfo = await this.getSessionInfo();
      if (sessionInfo?.uid) {
        this.uid = sessionInfo.uid;
        this.sessionId = sessionInfo.session_id;
        this.context = { ...this.context, uid: this.uid };
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en autenticación:", error);
      return false;
    }
  }

  async getSessionInfo() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${this.url}/web/session/get_session_info`,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {},
          id: Math.floor(Math.random() * 1000000000),
        }),
        onload: (response) => {
          try {
            const data = JSON.parse(response.responseText);
            resolve(data.result);
          } catch (error) {
            reject(error);
          }
        },
        onerror: reject,
      });
    });
  }

  async call(model, method, args = [], kwargs = {}) {
    return new Promise((resolve, reject) => {
      const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: model,
          method: method,
          args: args,
          kwargs: kwargs,
        },
        id: Math.floor(Math.random() * 1000000000),
      };

      GM_xmlhttpRequest({
        method: "POST",
        url: `${this.url}/web/dataset/call_kw/${model}/${method}`,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(payload),
        onload: (response) => {
          try {
            console.log("RPC Response:", response.responseText);
            const data = JSON.parse(response.responseText);
            if (data.error) {
              console.error("RPC Error:", data.error);
              reject(new Error(JSON.stringify(data.error)));
            } else {
              resolve(data.result);
            }
          } catch (error) {
            console.error("Parse Error:", error);
            reject(error);
          }
        },
        onerror: (error) => {
          console.error("Request Error:", error);
          reject(error);
        },
      });
    });
  }

  async odooSearch(model, domain = [], limit = 21, fields = ["odoo_id"]) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${this.url}/web/dataset/search_read`,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          id: Math.floor(Math.random() * 1000000000),
          jsonrpc: "2.0",
          method: "call",
          params: {
            context: this.context,
            model: model,
            domain: domain,
            fields: fields,
            limit: limit,
            sort: "",
          },
        }),
        onload: (response) => {
          try {
            const data = JSON.parse(response.responseText);
            if (data.error) {
              reject(new Error(data.error.message));
            } else {
              resolve(data.result);
            }
          } catch (error) {
            reject(error);
          }
        },
        onerror: reject,
      });
    });
  }

  formatDate(date) {
    let datetime = new Date(date).toISOString();
    datetime = datetime.split("T");
    return `${datetime[0]} ${datetime[1].split(".")[0]}`;
  }

  async createTimesheetEntry(
    projectId,
    taskId,
    description,
    hours,
    date = null,
    datetime = null
  ) {
    const today = date || new Date().toISOString().split("T")[0];
    datetime = datetime || this.formatDate(today);

    const timesheetData = {
      project_id: projectId,
      name: description,
      unit_amount: parseFloat(hours),
      date: today,
      date_time: datetime,
      user_id: this.uid,
    };

    if (taskId) {
      timesheetData.task_id = taskId;
    }

    console.log("Creating timesheet with data:", timesheetData);
    return await this.call("account.analytic.line", "create", [timesheetData]);
  }
}
