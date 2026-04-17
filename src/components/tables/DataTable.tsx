'use client';

import { useState, useEffect, useRef } from 'react';
import { Table, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DataTableProps<TData> {
  columns: ColumnsType<TData>;
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: keyof TData;
  loading?: boolean;
  rowKey?: string;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPaginationChange?: (page: number, pageSize: number) => void;
  onSearchChange?: (val: string) => void;
}

export function DataTable<TData extends object>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKey,
  loading = false,
  rowKey = '_id',
  total,
  currentPage,
  pageSize = 10,
  onPaginationChange,
  onSearchChange,
}: DataTableProps<TData>) {
  const [search, setSearch] = useState('');
  const isFirstRender = useRef(true);
  const onSearchChangeRef = useRef(onSearchChange);
  const lastSearchRef = useRef('');

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    if (onSearchChangeRef.current) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (search === lastSearchRef.current) return;

      const handler = setTimeout(() => {
        lastSearchRef.current = search;
        onSearchChangeRef.current?.(search);
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [search]);

  const filtered = searchKey && search && !onSearchChange
    ? data.filter((row) => {
        const val = row[searchKey];
        return String(val ?? '').toLowerCase().includes(search.toLowerCase());
      })
    : data;

  const handleTableChange = (pagination: any) => {
    const nextCurrent = pagination.current || 1;
    const nextPageSize = pagination.pageSize || 10;
    
    // Only trigger if values actually changed to prevent loops
    if (nextCurrent !== currentPage || nextPageSize !== pageSize) {
      onPaginationChange?.(nextCurrent, nextPageSize);
    }
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size={12}>
      {(searchKey || onSearchChange) && (
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, borderRadius: 8 }}
          allowClear
        />
      )}
      <Table<TData>
        columns={columns}
        dataSource={filtered}
        rowKey={rowKey}
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          pageSize: pageSize,
          current: currentPage,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (t, range) => `${range[0]}–${range[1]} of ${t} records`,
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
        style={{ borderRadius: 8 }}
      />
    </Space>
  );
}
