import { Logger } from '../../../../cli';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { formatting, validation } from '../../../../utils';
import SpoCommand from '../../../base/SpoCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  webUrl: string;
  listId?: string;
  listTitle?: string;
}

class SpoListViewListCommand extends SpoCommand {
  public get name(): string {
    return commands.LIST_VIEW_LIST;
  }

  public get description(): string {
    return 'Lists views configured on the specified list';
  }

  public defaultProperties(): string[] | undefined {
    return ['Id', 'Title', 'DefaultView', 'Hidden', 'BaseViewId'];
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
    this.#initOptionSets();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        listId: typeof args.options.listId !== 'undefined',
        listTitle: typeof args.options.listTitle !== 'undefined'
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-u, --webUrl <webUrl>'
      },
      {
        option: '-i, --listId [listId]'
      },
      {
        option: '-t, --listTitle [listTitle]'
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        const isValidSharePointUrl: boolean | string = validation.isValidSharePointUrl(args.options.webUrl);
        if (isValidSharePointUrl !== true) {
          return isValidSharePointUrl;
        }

        if (args.options.listId) {
          if (!validation.isValidGuid(args.options.listId)) {
            return `${args.options.listId} is not a valid GUID`;
          }
        }

        return true;
      }
    );
  }

  #initOptionSets(): void {
    this.optionSets.push(['listId', 'listTitle']);
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    if (this.verbose) {
      const list: string = (args.options.listId ? args.options.listId : args.options.listTitle) as string;
      logger.logToStderr(`Retrieving views information for list ${list} in site at ${args.options.webUrl}...`);
    }

    let requestUrl: string = '';

    if (args.options.listId) {
      requestUrl = `${args.options.webUrl}/_api/web/lists(guid'${formatting.encodeQueryParameter(args.options.listId)}')/views`;
    }
    else {
      requestUrl = `${args.options.webUrl}/_api/web/lists/GetByTitle('${formatting.encodeQueryParameter(args.options.listTitle as string)}')/views`;
    }

    const requestOptions: any = {
      url: requestUrl,
      headers: {
        'accept': 'application/json;odata=nometadata'
      },
      responseType: 'json'
    };

    try {
      const res = await request.get<any>(requestOptions);
      logger.log(res.value);
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }
}

module.exports = new SpoListViewListCommand(); 