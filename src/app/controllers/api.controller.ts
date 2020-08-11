import {
  Context, Delete, Get, HttpResponseCreated, HttpResponseNoContent,
  HttpResponseNotFound, HttpResponseOK, Post,
  ValidateBody, ValidatePathParam, TokenRequired
} from '@foal/core';
import { getRepository } from 'typeorm';

import { Todo, User } from '../entities';
import { TypeORMStore, fetchUser } from '@foal/typeorm';

@TokenRequired({
  cookie: true,
  store: TypeORMStore,
  // Make ctx.user be an instance of User.
  user: fetchUser(User),
})
export class ApiController {

  @Get('/todos')
  async getTodos(ctx: Context) {
    const todos = await getRepository(Todo).find({ owner: ctx.user });
    return new HttpResponseOK(todos);
  }

  @Post('/todos')
  @ValidateBody({
    additionalProperties: false,
    properties: {
      text: { type: 'string' }
    },
    required: ['text'],
    type: 'object',
  })
  async postTodo(ctx: Context) {
    const todo = new Todo();
    todo.text = ctx.request.body.text;
    // Make the current user the owner of the todo.
    todo.owner = ctx.user;

    await getRepository(Todo).save(todo);

    return new HttpResponseCreated(todo);
  }

  @Delete('/todos/:id')
  @ValidatePathParam('id', { type: 'number' })
  async deleteTodo(ctx: Context) {
    const todo = await getRepository(Todo).findOne({
      id: +ctx.request.params.id,
      // Do not return the todo if it does not belong to the current user.
      owner: ctx.user
    });
    if (!todo) {
      return new HttpResponseNotFound();
    }
    await getRepository(Todo).remove(todo);
    return new HttpResponseNoContent();
  }

}