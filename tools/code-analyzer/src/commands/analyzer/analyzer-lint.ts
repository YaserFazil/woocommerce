/**
 * External dependencies
 */
import { Command } from '@commander-js/extra-typings';
import { Logger } from 'cli-core/src/logger';
import { cloneRepo, generateDiff, generateSchemaDiff } from '../../git';
import { promisify } from 'util';
import { exec } from 'child_process';
import { join } from 'path';
const execAsync = promisify( exec );
// program.option( '-f, --force', 'force installation' );
// const pkgs = program.args;

const program = new Command()

	.argument(
		'<compare>',
		'GitHub branch or commit hash to compare against the base branch/commit.'
	)
	.argument(
		'<sinceVersion>',
		'Specify the version used to determine which changes are included (version listed in @since code doc).'
	)
	.option(
		'-b, --base <base>',
		'GitHub base branch or commit hash.',
		'trunk'
	)
	.option(
		'-s, --source <source>',
		'Git repo url or local path to a git repo.',
		process.cwd()
	)
	.option(
		'-f, --fileName <fileName>',
		'Filename for the generated change JSON',
		'changes.json'
	)
	.option(
		'-ss, --skipSchemaCheck',
		'Skip the schema check, enable this if you are not analyzing WooCommerce'
	)
	.action( async ( compare, sinceVersion, options ) => {
		const { fileName, skipSchemaCheck, source, base } = options;

		Logger.startTask( `Making temporary clone of ${ source }...` );
		const tmpRepoPath = await cloneRepo( source );
		Logger.endTask();
		Logger.notice(
			`Temporary clone of ${ source } created at ${ tmpRepoPath }`
		);

		const diff = await generateDiff();

		const pluginPath = join( tmpRepoPath, 'plugins/woocommerce' );

		if ( ! skipSchemaCheck ) {
			const build = async () => {
				// Note doing the minimal work to get a DB scan to work, avoiding full build for speed.
				await execAsync( 'composer install', { cwd: pluginPath } );
				await execAsync(
					'pnpm run build:feature-config --filter=woocommerce',
					{
						cwd: pluginPath,
					}
				);
			};

			Logger.startTask( 'Generating schema diff...' );
			const schemaDiff = await generateSchemaDiff(
				tmpRepoPath,
				compare,
				base,
				build,
				Logger.error
			);
			Logger.endTask();
		}

		// console.log( 'compare', compare );
		// console.log( 'sinceVersion', sinceVersion );
	} );

program.parse( process.argv );

/**
 * Analyzer class
 */
// class Analyzer extends Command {
// /**
//  * CLI description
//  */
// static description = 'Analyze code changes in WooCommerce Monorepo.';

// /**
//  * CLI arguments
//  */
// static args = [
// 	{
// 		name: 'compare',
// 		description:
// 			'GitHub branch or commit hash to compare against the base branch/commit.',
// 		required: true,
// 	},
// 	{
// 		name: 'sinceVersion',
// 		description:
// 			'Specify the version used to determine which changes are included (version listed in @since code doc).',
// 		required: true,
// 	},
// ];

/**
 * CLI flags.
 */
// static flags = {
// 	base: Flags.string( {
// 		char: 'b',
// 		description: 'GitHub base branch or commit hash.',
// 		default: 'trunk',
// 	} ),
// 	output: Flags.string( {
// 		char: 'o',
// 		description: 'Output styling.',
// 		options: [ 'console', 'github' ],
// 		default: 'console',
// 	} ),
// 	source: Flags.string( {
// 		char: 's',
// 		description: 'Git repo url or local path to a git repo.',
// 		default: process.cwd(),
// 	} ),
// 	file: Flags.string( {
// 		char: 'f',
// 		description: 'Filename for change description JSON.',
// 		default: 'changes.json',
// 	} ),
// 	plugin: Flags.string( {
// 		char: 'p',
// 		description: 'Plugin to check for',
// 		options: [ 'core', 'admin', 'beta' ],
// 		default: 'core',
// 	} ),
// 	'is-woocommerce': Flags.boolean( {
// 		char: 'w',
// 		description:
// 			'Analyzing WooCommerce? (Will scan for DB schema changes).',
// 		default: true,
// 	} ),
// };

/**
 * This method is called to execute the command
 */
// 	async run(): Promise< void > {
// 		const { args, flags } = await this.parse( Analyzer );

// 		const { compare, sinceVersion } = args;
// 		const { base } = flags;

// 		CliUx.ux.action.start(
// 			`Making a temporary clone of '${ flags.source }'`
// 		);
// 		const tmpRepoPath = await cloneRepo( flags.source );
// 		CliUx.ux.action.stop();

// 		CliUx.ux.action.start(
// 			`Comparing '${ flags.base }' with '${ args.compare }'`
// 		);
// 		const diff = await generateDiff(
// 			tmpRepoPath,
// 			flags.base,
// 			compare,
// 			this.error
// 		);
// 		CliUx.ux.action.stop();

// 		// Run schema diffs only in the monorepo.
// 		if ( flags[ 'is-woocommerce' ] ) {
// 			const pluginPath = join( tmpRepoPath, 'plugins/woocommerce' );

// 			const build = () => {
// 				CliUx.ux.action.start( 'Building WooCommerce' );
// 				// Note doing the minimal work to get a DB scan to work, avoiding full build for speed.
// 				execSync( 'composer install', { cwd: pluginPath, stdio: [] } );
// 				execSync(
// 					'pnpm run build:feature-config --filter=woocommerce',
// 					{
// 						cwd: pluginPath,
// 					}
// 				);

// 				CliUx.ux.action.stop();
// 			};

// 			CliUx.ux.action.start(
// 				`Comparing WooCommerce DB schemas of '${ base }' and '${ compare }'`
// 			);

// 			const schemaDiff = await generateSchemaDiff(
// 				tmpRepoPath,
// 				compare,
// 				base,
// 				build,
// 				( e: string ): void => this.error( e )
// 			);

// 			CliUx.ux.action.stop();

// 			await this.scanChanges( diff, sinceVersion, flags, schemaDiff );
// 		} else {
// 			await this.scanChanges( diff, sinceVersion, flags );
// 		}

// 		// Clean up the temporary repo.
// 		CliUx.ux.action.start( 'Cleaning up temporary files' );
// 		rmSync( tmpRepoPath, { force: true, recursive: true } );
// 		CliUx.ux.action.stop();
// 	}

// 	/**
// 	 * Scan patches for changes in templates, hooks and database schema
// 	 *
// 	 * @param {string}  content         Patch content.
// 	 * @param {string}  version         Current product version.
// 	 * @param {string}  output          Output style.
// 	 * @param {string}  changesFileName Name of a file to output change information to.
// 	 * @param {boolean} schemaEquality  if schemas are equal between branches.
// 	 */
// 	private async scanChanges(
// 		content: string,
// 		version: string,
// 		flags: OutputFlags< typeof Analyzer[ 'flags' ] >,
// 		schemaDiff: {
// 			[ key: string ]: {
// 				description: string;
// 				base: string;
// 				compare: string;
// 				method: string;
// 				areEqual: boolean;
// 			};
// 		} | void
// 	) {
// 		const { output, file } = flags;

// 		const templates = this.scanTemplates( content, version );
// 		const hooks = this.scanHooks( content, version, output );
// 		const databaseUpdates = this.scanDatabases( content );
// 		let schemaDiffResult = {};

// 		CliUx.ux.action.start(
// 			`Generating a list of changes since ${ version }.`
// 		);

// 		if ( templates.size ) {
// 			printTemplateResults(
// 				templates,
// 				output,
// 				'TEMPLATE CHANGES',
// 				( s: string ): void => this.log( s )
// 			);
// 		} else {
// 			this.log( 'No template changes found' );
// 		}

// 		if ( hooks.size ) {
// 			printHookResults( hooks, output, 'HOOKS', ( s: string ): void =>
// 				this.log( s )
// 			);
// 		} else {
// 			this.log( 'No new hooks found' );
// 		}

// 		if ( ! areSchemasEqual( schemaDiff ) ) {
// 			schemaDiffResult = printSchemaChange(
// 				schemaDiff,
// 				version,
// 				output,
// 				( s: string ): void => this.log( s )
// 			);
// 		} else {
// 			this.log( 'No new schema changes found' );
// 		}

// 		if ( databaseUpdates ) {
// 			printDatabaseUpdates(
// 				databaseUpdates,
// 				output,
// 				( s: string ): void => this.log( s )
// 			);
// 		} else {
// 			this.log( 'No database updates found' );
// 		}

// 		await generateJSONFile( join( process.cwd(), file ), {
// 			templates: Object.fromEntries( templates.entries() ),
// 			hooks: Object.fromEntries( hooks.entries() ),
// 			db: databaseUpdates || {},
// 			schema: schemaDiffResult || {},
// 		} );

// 		CliUx.ux.action.stop();
// 	}
// 	/**
// 	 * Scan patches for changes in the database
// 	 *
// 	 * @param {string} content Patch content.
// 	 * @param {string} version Current product version.
// 	 * @param {string} output  Output style.
// 	 * @return {object|null}
// 	 */
// 	private scanDatabases(
// 		content: string
// 	): { updateFunctionName: string; updateFunctionVersion: string } | null {
// 		CliUx.ux.action.start( 'Scanning database changes' );
// 		const matchPatches = /^a\/(.+).php/g;
// 		const patches = getPatches( content, matchPatches );
// 		const databaseUpdatePatch = patches.find( ( patch ) => {
// 			const lines = patch.split( '\n' );
// 			const filepath = getFilename( lines[ 0 ] );
// 			return filepath.includes( 'class-wc-install.php' );
// 		} );

// 		if ( ! databaseUpdatePatch ) {
// 			return null;
// 		}

// 		const updateFunctionRegex =
// 			/\+{1,2}\s*'(\d.\d.\d)' => array\(\n\+{1,2}\s*'(.*)',\n\+{1,2}\s*\),/m;
// 		const match = databaseUpdatePatch.match( updateFunctionRegex );

// 		if ( ! match ) {
// 			return null;
// 		}
// 		const updateFunctionVersion = match[ 1 ];
// 		const updateFunctionName = match[ 2 ];
// 		CliUx.ux.action.stop();
// 		return { updateFunctionName, updateFunctionVersion };
// 	}

// 	/**
// 	 * Scan patches for changes in templates
// 	 *
// 	 * @param {string} content Patch content.
// 	 * @param {string} version Current product version.
// 	 * @return {Promise<Map<string, string[]>>} Promise.
// 	 */
// 	private scanTemplates(
// 		content: string,
// 		version: string
// 	): Map< string, string[] > {
// 		CliUx.ux.action.start(
// 			`Scanning for template changes since ${ version }.`
// 		);

// 		const report: Map< string, string[] > = new Map< string, string[] >();

// 		if ( ! content.match( /diff --git a\/(.+)\/templates\/(.+)/g ) ) {
// 			CliUx.ux.action.stop();
// 			return report;
// 		}

// 		const matchPatches = /^a\/(.+)\/templates\/(.+)/g;
// 		const title = 'Template change detected';
// 		const patches = getPatches( content, matchPatches );
// 		const matchVersion = `^(\\+.+\\*.+)(@version)\\s+(${ version.replace(
// 			/\./g,
// 			'\\.'
// 		) }).*`;
// 		const versionRegex = new RegExp( matchVersion, 'g' );

// 		for ( const p in patches ) {
// 			const patch = patches[ p ];
// 			const lines = patch.split( '\n' );
// 			const filepath = getFilename( lines[ 0 ] );
// 			let code = 'warning';
// 			let message = 'This template may require a version bump!';

// 			for ( const l in lines ) {
// 				const line = lines[ l ];

// 				if ( line.match( versionRegex ) ) {
// 					code = 'notice';
// 					message = 'Version bump found';
// 				}
// 			}

// 			if ( code === 'notice' && report.get( filepath ) ) {
// 				report.set( filepath, [ code, title, message ] );
// 			} else if ( ! report.get( filepath ) ) {
// 				report.set( filepath, [ code, title, message ] );
// 			}
// 		}

// 		CliUx.ux.action.stop();
// 		return report;
// 	}

// 	/**
// 	 * Scan patches for hooks
// 	 *
// 	 * @param {string} content Patch content.
// 	 * @param {string} version Current product version.
// 	 * @param {string} output  Output style.
// 	 * @return {Promise<Map<string, Map<string, string[]>>>} Promise.
// 	 */
// 	private scanHooks(
// 		content: string,
// 		version: string,
// 		output: string
// 	): Map< string, Map< string, string[] > > {
// 		CliUx.ux.action.start( `Scanning for new hooks since ${ version }.` );

// 		const report: Map< string, Map< string, string[] > > = new Map<
// 			string,
// 			Map< string, string[] >
// 		>();

// 		if ( ! content.match( /diff --git a\/(.+).php/g ) ) {
// 			CliUx.ux.action.stop();
// 			return report;
// 		}

// 		const matchPatches = /^a\/(.+).php/g;
// 		const patches = getPatches( content, matchPatches );
// 		const verRegEx = getVersionRegex( version );
// 		const matchHooks = `\(.*?)@since\\s+(${ verRegEx })(.*?)(apply_filters|do_action)\\((\\s+)?(\\'|\\")(.*?)(\\'|\\")`;
// 		const newRegEx = new RegExp( matchHooks, 'gs' );

// 		for ( const p in patches ) {
// 			const patch = patches[ p ];
// 			// Separate patches into bits beginning with a comment. If a bit does not have an action, disregard.
// 			const patchWithHook = patch.split( '/**' ).find( ( s ) => {
// 				return (
// 					s.includes( 'apply_filters' ) || s.includes( 'do_action' )
// 				);
// 			} );
// 			if ( ! patchWithHook ) {
// 				continue;
// 			}
// 			const results = patchWithHook.match( newRegEx );
// 			const hooksList: Map< string, string[] > = new Map<
// 				string,
// 				string[]
// 			>();

// 			if ( ! results ) {
// 				continue;
// 			}

// 			const lines = patch.split( '\n' );
// 			const filepath = getFilename( lines[ 0 ] );

// 			for ( const raw of results ) {
// 				// Extract hook name and type.
// 				const hookName = raw.match(
// 					/(.*)(do_action|apply_filters)\(\s+'(.*)'/
// 				);

// 				if ( ! hookName ) {
// 					continue;
// 				}

// 				const name = getHookName( hookName[ 3 ] );

// 				const description = getHookDescription( raw, name ) || '';

// 				if ( ! description ) {
// 					this.error(
// 						`Hook ${ name } has no description. Please add a description.`,
// 						{ exit: false }
// 					);
// 				}

// 				const kind =
// 					hookName[ 2 ] === 'do_action' ? 'action' : 'filter';
// 				const CLIMessage = `**${ name }** introduced in ${ version }`;
// 				const GithubMessage = `\\'${ name }\\' introduced in ${ version }`;
// 				const message =
// 					output === 'github' ? GithubMessage : CLIMessage;
// 				const hookChangeType = getHookChangeType( raw );
// 				const title = `${ hookChangeType } ${ kind } found`;

// 				if ( ! hookName[ 2 ].startsWith( '-' ) ) {
// 					hooksList.set( name, [
// 						'NOTICE',
// 						title,
// 						message,
// 						description,
// 					] );
// 				}
// 			}

// 			report.set( filepath, hooksList );
// 		}

// 		CliUx.ux.action.stop();
// 		return report;
// 	}
// }