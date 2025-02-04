import { Logger } from '../../../../cli';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { spo, validation } from '../../../../utils';
import SpoCommand from '../../../base/SpoCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  id: string;
  title?: string;
  webTemplate?: string;
  siteScripts?: string;
  description?: string;
  previewImageUrl?: string;
  previewImageAltText?: string;
  thumbnailUrl?: string;
  version?: number | string;
  isDefault?: string;
}

class SpoSiteDesignSetCommand extends SpoCommand {
  public get name(): string {
    return commands.SITEDESIGN_SET;
  }

  public get description(): string {
    return 'Updates a site design with new values';
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
        title: typeof args.options.title !== 'undefined',
        webTemplate: args.options.webTemplate,
        siteScripts: typeof args.options.siteScripts !== 'undefined',
        description: typeof args.options.description !== 'undefined',
        previewImageUrl: typeof args.options.previewImageUrl !== 'undefined',
        previewImageAltText: typeof args.options.previewImageAltText !== 'undefined',
        thumbnailUrl: typeof args.options.thumbnailUrl !== 'undefined',
        version: typeof args.options.version !== 'undefined',
        isDefault: typeof args.options.isDefault !== 'undefined'
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-i, --id <id>'
      },
      {
        option: '-t, --title [title]'
      },
      {
        option: '-w, --webTemplate [webTemplate]',
        autocomplete: ['TeamSite', 'CommunicationSite']
      },
      {
        option: '-s, --siteScripts [siteScripts]'
      },
      {
        option: '-d, --description [description]'
      },
      {
        option: '-m, --previewImageUrl [previewImageUrl]'
      },
      {
        option: '-a, --previewImageAltText [previewImageAltText]'
      },
      {
        option: '--thumbnailUrl [thumbnailUrl]'
      },
      {
        option: '-v, --version [version]'
      },
      {
        option: '--isDefault [isDefault]'
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        if (!validation.isValidGuid(args.options.id)) {
          return `${args.options.id} is not a valid GUID`;
        }

        if (args.options.webTemplate &&
          args.options.webTemplate !== 'TeamSite' &&
          args.options.webTemplate !== 'CommunicationSite') {
          return `${args.options.webTemplate} is not a valid web template type. Allowed values TeamSite|CommunicationSite`;
        }

        if (args.options.siteScripts) {
          const siteScripts = args.options.siteScripts.split(',');
          for (let i: number = 0; i < siteScripts.length; i++) {
            const trimmedId: string = siteScripts[i].trim();
            if (!validation.isValidGuid(trimmedId)) {
              return `${trimmedId} is not a valid GUID`;
            }
          }
        }

        if (args.options.version &&
          typeof args.options.version !== 'number') {
          return `${args.options.version} is not a number`;
        }

        if (typeof args.options.isDefault !== 'undefined' &&
          args.options.isDefault !== 'true' &&
          args.options.isDefault !== 'false') {
          return `${args.options.isDefault} is not a valid boolean value`;
        }

        return true;
      }
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      const spoUrl: string = await spo.getSpoUrl(logger, this.debug);
      const updateInfo: any = {
        Id: args.options.id
      };

      if (args.options.title) {
        updateInfo.Title = args.options.title;
      }
      if (args.options.description) {
        updateInfo.Description = args.options.description;
      }
      if (args.options.siteScripts) {
        updateInfo.SiteScriptIds = args.options.siteScripts.split(',').map(i => i.trim());
      }
      if (args.options.previewImageUrl) {
        updateInfo.PreviewImageUrl = args.options.previewImageUrl;
      }
      if (args.options.previewImageAltText) {
        updateInfo.PreviewImageAltText = args.options.previewImageAltText;
      }
      if (args.options.thumbnailUrl) {
        updateInfo.ThumbnailUrl = args.options.thumbnailUrl;
      }
      if (args.options.webTemplate) {
        updateInfo.WebTemplate = args.options.webTemplate === 'TeamSite' ? '64' : '68';
      }
      if (args.options.version) {
        updateInfo.Version = args.options.version;
      }
      if (typeof args.options.isDefault !== 'undefined') {
        updateInfo.IsDefault = args.options.isDefault === 'true';
      }

      const requestOptions: any = {
        url: `${spoUrl}/_api/Microsoft.Sharepoint.Utilities.WebTemplateExtensions.SiteScriptUtility.UpdateSiteDesign`,
        headers: {
          'content-type': 'application/json;charset=utf-8',
          accept: 'application/json;odata=nometadata',
          responseType: 'json'
        },
        data: { updateInfo: updateInfo },
        responseType: 'json'
      };

      const res: any = await request.post(requestOptions);
      logger.log(res);
    } 
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }
}

module.exports = new SpoSiteDesignSetCommand();
