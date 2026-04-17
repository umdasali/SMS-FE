'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f8fafc',
          padding: 24
        }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle="The application encountered an unexpected error. We've been notified."
            extra={[
              <Button 
                type="primary" 
                key="reload" 
                icon={<ReloadOutlined />} 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>,
              <Button 
                key="home" 
                icon={<HomeOutlined />} 
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to Dashboard
              </Button>,
            ]}
          >
            <div style={{ marginTop: 20 }}>
              <Text type="secondary" code>
                {this.state.error?.message || 'Unknown Error'}
              </Text>
            </div>
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
