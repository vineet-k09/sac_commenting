import { randomUUID } from "crypto";
import { BigQueryClient } from "../../shared/big-query/bq-client";
import { CommentLevel } from "./commenting.types";
import { PROJECT_ID, DB_NAME } from "../../..";

const getTable = () => {
    return `${PROJECT_ID}.${DB_NAME}.comments`;
};

const getHistoryTable = () => {
    return `${PROJECT_ID}.${DB_NAME}.comment_history`;
};

const bq = new BigQueryClient();

export async function getCommentById(id: string) {
    const query = `SELECT * FROM ${getTable()} WHERE id = @id`;
    const res = await bq.query<any>(query, { id });
    return res.data[0];
}

export async function createCommentHistory(
    commentId: string,
    owner: string,
    oldContent: string,
    newContent: string,
    changedBy: string
) {
    const query = `
        INSERT INTO ${getHistoryTable()}
        (comment_id, owner, old_content, new_content, changed_by, changed_at)
        VALUES
        (@commentId, @owner, @oldContent, @newContent, @changedBy, CURRENT_TIMESTAMP())
    `;
    const params = { commentId, owner, oldContent, newContent, changedBy };
    return await bq.query(query, params);
}

export async function createComment(
    user: string,
    content: string, 
    level: CommentLevel, 
    filter: string,
    dashboard: string,
    wb_keys: string,
    is_private: boolean = false,
    is_locked: boolean = false
){
    const id = randomUUID();

    const query = `
        INSERT INTO ${getTable()}
        (
        id,
        user,
        content,
        level,
        filter,
        dashboard,
        wb_keys,
        is_private,
        is_locked,
        created_at
        ) VALUES (
         @id,
         @user,
         @content,
         @level,
         @filter,
         @dashboard,
         @wb_keys,
         @is_private,
         @is_locked,
         CURRENT_TIMESTAMP()
        )`;

    const queryParams = {
        id,
        user,
        content,
        level,
        filter,
        dashboard,
        wb_keys,
        is_private,
        is_locked
    };

    const res = await bq.query(query, queryParams);

    return res;
}

// TODO: Implement dashboard name filter
export async function getComments(filter?: string){
    let query = `SELECT * FROM ${getTable()}`;
    if (filter) {
        query += ` WHERE filter = @filter`;
    }
    query += ` ORDER BY created_at DESC LIMIT 1000`;
    const results = await bq.query(query, filter ? { filter } : undefined);
    return results.data;
}

export async function deleteComment(id: string){
    const query = `DELETE FROM ${getTable()} WHERE id = @id`;
    const queryParams = { id };
    const res = await bq.query(query, queryParams);
    return res;
}

export async function putComment(id: string, user: string, content: string, level: CommentLevel, filter: string, username: string, is_private: boolean = false, is_locked: boolean = false){
    const oldComment = await getCommentById(id);
    if (oldComment && oldComment.content !== content) {
        await createCommentHistory(id, oldComment.user, oldComment.content, content, username);
    }

    const query = 
    `UPDATE ${getTable()} 
    SET user = @user, 
    content = @content, 
    level = @level, 
    filter = @filter,
    modified_by = @username,
    is_private = @is_private,
    is_locked = @is_locked,
    modified_at = CURRENT_TIMESTAMP() 
    WHERE id = @id`;
    const queryParams = { id, user, content, level, filter, username, is_private, is_locked};
    const res = await bq.query(query, queryParams);
    return res;
}