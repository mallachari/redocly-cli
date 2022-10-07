import { outdent } from 'outdent';
import { lintDocument } from '../../../lint';
import { parseYamlToDocument, replaceSourceWithRef, makeConfig } from '../../../../__tests__/utils';
import { BaseResolver } from '../../../resolve';

describe('Oas3 spec', () => {
  it('should report missing schema property', async () => {
    const document = parseYamlToDocument(
      outdent`
      openapi: 3.0.0
      paths:
        '/test':
          get:
            summary: Gets a specific pet
            parameters:
            - name: petId
              in: path
            responses:
              200:
                description: Ok
        `,
      'foobar.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await makeConfig({ spec: 'error' }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      Array [
        Object {
          "from": undefined,
          "location": Array [
            Object {
              "pointer": "#/",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "The field \`info\` must be present on this level.",
          "ruleId": "spec",
          "severity": "error",
          "suggest": Array [],
        },
        Object {
          "from": undefined,
          "location": Array [
            Object {
              "pointer": "#/paths/~1test/get/parameters/0",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "Must contain at least one of the following fields: schema, content.",
          "ruleId": "spec",
          "severity": "error",
          "suggest": Array [],
        },
      ]
    `);
  });

  it('should report with "referenced from"', async () => {
    const document = parseYamlToDocument(
      outdent`
      openapi: 3.0.0
      components:
        requestBodies:
          TestRequestBody:
            content:
              application/json:
                schema:
                  type: object
        schemas:
          TestSchema:
            title: TestSchema
            allOf:
              - $ref: "#/components/requestBodies/TestRequestBody"
        `,
      'foobar.yaml'
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await makeConfig({ spec: 'error' }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      Array [
        Object {
          "from": undefined,
          "location": Array [
            Object {
              "pointer": "#/",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "The field \`paths\` must be present on this level.",
          "ruleId": "spec",
          "severity": "error",
          "suggest": Array [],
        },
        Object {
          "from": undefined,
          "location": Array [
            Object {
              "pointer": "#/",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "The field \`info\` must be present on this level.",
          "ruleId": "spec",
          "severity": "error",
          "suggest": Array [],
        },
        Object {
          "from": Object {
            "pointer": "#/components/schemas/TestSchema/allOf/0",
            "source": "foobar.yaml",
          },
          "location": Array [
            Object {
              "pointer": "#/components/requestBodies/TestRequestBody/content",
              "reportOnKey": true,
              "source": "foobar.yaml",
            },
          ],
          "message": "Property \`content\` is not expected here.",
          "ruleId": "spec",
          "severity": "error",
          "suggest": Array [],
        },
      ]
    `);
  });
});

describe('Oas3.1 spec', () => {
  it('should report with "type can be one of the following only"', async () => {
    const document = parseYamlToDocument(
      outdent`
      openapi: 3.1.0
      info:
        version: 1.0.0
        title: Example.com
        description: info,
        license:
          name: Apache 2.0
          url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
      components:
        schemas:
          TestSchema:
            title: TestSchema
            description: Property name's description
            type: test
        `
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await makeConfig({ spec: 'error' }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      Array [
        Object {
          "from": undefined,
          "location": Array [
            Object {
              "pointer": "#/components/schemas/TestSchema/type",
              "reportOnKey": false,
              "source": "",
            },
          ],
          "message": "\`type\` can be one of the following only: \\"object\\", \\"array\\", \\"string\\", \\"number\\", \\"integer\\", \\"boolean\\", \\"null\\".",
          "ruleId": "spec",
          "severity": "error",
          "suggest": Array [],
        },
      ]
    `);
  });

  it('should report with unknown type in type`s list', async () => {
    const document = parseYamlToDocument(
      outdent`
      openapi: 3.1.0
      info:
        version: 1.0.0
        title: Example.com
        description: info,
        license:
          name: Apache 2.0
          url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
      components:
        schemas:
          TestSchema:
            title: TestSchema
            description: Property name's description
            type:
              - string
              - foo
        `
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await makeConfig({ spec: 'error' }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`
      Array [
        Object {
          "from": undefined,
          "location": Array [
            Object {
              "pointer": "#/components/schemas/TestSchema/type/1",
              "reportOnKey": false,
              "source": "",
            },
          ],
          "message": "\`type\` can be one of the following only: \\"object\\", \\"array\\", \\"string\\", \\"number\\", \\"integer\\", \\"boolean\\", \\"null\\".",
          "ruleId": "spec",
          "severity": "error",
          "suggest": Array [],
        },
      ]
    `);
  });

  it('should not report about unknown type', async () => {
    const document = parseYamlToDocument(
      outdent`
      openapi: 3.1.0
      info:
        version: 1.0.0
        title: Example.com
        description: info,
        license:
          name: Apache 2.0
          url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
      components:
        schemas:
          TestSchema:
            title: TestSchema
            description: Property name's description
            type: null
        `
    );

    const results = await lintDocument({
      externalRefResolver: new BaseResolver(),
      document,
      config: await makeConfig({ spec: 'error' }),
    });

    expect(replaceSourceWithRef(results)).toMatchInlineSnapshot(`Array []`);
  });
});
