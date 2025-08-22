import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Post: a
    .model({
      id: a.id().required(),
      content: a.string().required(),
      category: a.string().required(),
      reactions: a.json(),
      passcode_hash: a.string().required(),
      created_at: a.datetime().required(),
      updated_at: a.datetime().required(),
    })
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});