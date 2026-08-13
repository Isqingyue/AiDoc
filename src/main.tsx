import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App";
import "antd/dist/reset.css";
import "./styles/tailwind.css";
import "./styles/app.css";
import "./styles/antd.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("应用挂载节点 #root 不存在");
}

createRoot(root).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#356df3",
          colorInfo: "#356df3",
          colorSuccess: "#2fa36b",
          colorWarning: "#d99a28",
          colorError: "#d84c5b",
          colorText: "#202a3d",
          colorTextSecondary: "#748096",
          colorBorder: "#dfe4ed",
          colorBgLayout: "#f5f7fb",
          borderRadius: 8,
          borderRadiusLG: 12,
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Button: { controlHeight: 36, fontWeight: 600 },
          Input: { controlHeight: 38 },
          Select: { controlHeight: 38 },
          Modal: { titleFontSize: 20 },
          Table: { headerBg: "#f7f8fb", headerColor: "#667187", rowHoverBg: "#f8faff" },
        },
      }}
    >
      <AntApp><App /></AntApp>
    </ConfigProvider>
  </StrictMode>,
);
