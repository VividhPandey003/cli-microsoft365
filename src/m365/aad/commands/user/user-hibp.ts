import { Logger } from '../../../../cli';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { validation } from '../../../../utils';
import AnonymousCommand from '../../../base/AnonymousCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  userName: string;
  apiKey: string;
  domain?: string
}

class AadUserHibpCommand extends AnonymousCommand {
  public get name(): string {
    return commands.USER_HIBP;
  }

  public get description(): string {
    return 'Allows you to retrieve all accounts that have been pwned with the specified username';
  }

  constructor() {
    super();
  
    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
  }
  
  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        domain: args.options.domain
      });
    });
  }
  
  #initOptions(): void {
    this.options.unshift(
      {
        option: '-n, --userName <userName>'
      },
      {
        option: '--apiKey, <apiKey>'
      },
      {
        option: '--domain, [domain]'
      }
    );
  }
  
  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        if (!validation.isValidUserPrincipalName(args.options.userName)) {
          return 'Specify valid userName';
        }
    
        return true;
      }
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      const requestOptions: any = {
        url: `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(args.options.userName)}${(args.options.domain ? `?domain=${encodeURIComponent(args.options.domain)}` : '')}`,
        headers: {
          'accept': 'application/json',
          'hibp-api-key': args.options.apiKey,
          'x-anonymous': true
        },
        responseType: 'json'
      };

      const res = await request.get(requestOptions);
      logger.log(res);
    }
    catch (err: any) {
      if ((err && err.response !== undefined && err.response.status === 404) && (this.debug || this.verbose)) {
        logger.log('No pwnage found');
        return;
      }
      this.handleRejectedODataJsonPromise(err);
    }
  }
}

module.exports = new AadUserHibpCommand();