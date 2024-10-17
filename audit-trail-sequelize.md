# Sequelize with Audit Trail

Audit trail for create, update, and delete operations in your NestJS application using Sequelize, you can follow this pattern:

## Steps:
### Create an Audit Trail Table:

- Define a separate table to store audit records. This table will keep track of who made changes, the operation type (insert, update, delete), and any relevant metadata (e.g., changed values).
  
### Use Sequelize Hooks:

- Sequelize provides lifecycle hooks (beforeCreate, beforeUpdate, beforeDestroy, etc.), which can be used to log audit trail records before the actual operations.

### Insert Audit Logs:

- In each hook, capture the necessary information (e.g., user ID, operation type, timestamp, old and new data) and store it in your audit trail table.

1. Define the Audit Trail Model:
   ```ts
   import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'audit_trail',
  timestamps: false, // Handle timestamps manually
})
export class AuditTrail extends Model<AuditTrail> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  operation!: string; // 'INSERT', 'UPDATE', 'DELETE'

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number; // ID of the user who performed the operation

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  table_name!: string; // Name of the table being modified

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  old_data?: object; // Previous data before the update or delete

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  new_data?: object; // New data after insert or update

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  timestamp!: Date;
}

```


2. Implement Sequelize Hooks in Your Model:
  For example, in your KpiConfigDetail model:

```ts
import { Table, Column, Model, DataType, BeforeUpdate, BeforeCreate, BeforeDestroy } from 'sequelize-typescript';
import { AuditTrail } from './audit-trail.model'; // Import your AuditTrail model

@Table({
  tableName: 'kpi_config_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class KpiConfigDetail extends Model<KpiConfigDetail> {
  // Your model columns

  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id!: number;

  // Other columns...

  // Hook for Create operation
  @BeforeCreate
  static async auditCreate(instance: KpiConfigDetail) {
    await AuditTrail.create({
      operation: 'INSERT',
      user_id: getCurrentUserId(), // Retrieve the current user ID from session or request context
      table_name: 'kpi_config_details',
      new_data: instance, // New data after insert
      timestamp: new Date(),
    });
  }

  // Hook for Update operation
  @BeforeUpdate
  static async auditUpdate(instance: KpiConfigDetail) {
    const previousData = await instance.previous(); // Fetch the previous data before update

    await AuditTrail.create({
      operation: 'UPDATE',
      user_id: getCurrentUserId(),
      table_name: 'kpi_config_details',
      old_data: previousData, // Old data before update
      new_data: instance, // New data after update
      timestamp: new Date(),
    });
  }

  // Hook for Delete operation
  @BeforeDestroy
  static async auditDelete(instance: KpiConfigDetail) {
    await AuditTrail.create({
      operation: 'DELETE',
      user_id: getCurrentUserId(),
      table_name: 'kpi_config_details',
      old_data: instance, // Data before deletion
      timestamp: new Date(),
    });
  }
}
```
3. Helper Function to Get Current User:
You can retrieve the current user from the request or session. You’ll need to implement this function based on how you handle authentication in your application.

```ts
function getCurrentUserId(): number {
  // Replace this with your actual implementation to retrieve the current user's ID
  return 1; // Example: Hardcoded admin user, but replace with real user context
}
```





