import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

const defaultModeratorId = '53231f78-13d6-11ed-861d-0242ac120002';

export class DefaultModeratorUserMigration implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      const res = await queryRunner.query(
        `SELECT id FROM manager_users WHERE id='${defaultModeratorId}';`,
      );
      if (res[0].length) {
        return;
      }

      const moderatorRoleRes = await queryRunner.query(
        "SELECT id FROM roles WHERE value='MODERATOR';",
      );
      const moderatorRoleId = moderatorRoleRes[0].pop()['id'];
      if (!moderatorRoleId) {
        const msg = 'firstly init user roles';
        console.log('Error:', msg);
        throw new Error(msg);
      }

      const hashPassword = await bcrypt.hash('password', 5);
      await queryRunner.query(
        'INSERT INTO manager_users (id, email, password "roleId") \n' +
          `VALUES ('${defaultModeratorId}', 'moderator@local', '${hashPassword}', '${moderatorRoleId}');`,
      );
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    await sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
    });
  },

  down: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;
    await sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      await sequelize.query(
        `DELETE FROM user_roles WHERE "userId"='${defaultModeratorId}';`,
        transactionHost,
      );
      await sequelize.query(
        `DELETE FROM manager_users WHERE id='${defaultModeratorId}';`,
        transactionHost,
      );
    });
  },
};
