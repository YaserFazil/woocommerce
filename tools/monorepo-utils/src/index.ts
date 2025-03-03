/**
 * External dependencies
 */
import { Command } from '@commander-js/extra-typings';
import figlet from 'figlet';
import chalk from 'chalk';
import dotenv from 'dotenv';

/**
 * Internal dependencies
 */
import CodeFreeze from './code-freeze/commands';
import Slack from './slack/commands/slack';
import Changefile from './changefile';
import WorkflowProfiler from './workflow-profiler/commands';
import { Logger } from './core/logger';
import { isGithubCI } from './core/environment';

dotenv.config();

if ( ! isGithubCI() ) {
	Logger.notice(
		chalk
			.rgb( 150, 88, 138 )
			.bold( figlet.textSync( 'WooCommerce \n Utils' ) )
	);
}

const program = new Command()
	.name( 'utils' )
	.description( 'Monorepo utilities' )
	.addCommand( CodeFreeze )
	.addCommand( Slack )
	.addCommand( Changefile )
	.addCommand( WorkflowProfiler );

program.exitOverride();

const run = async () => {
	try {
		//  parseAsync handles cases where the action is async and not async.
		await program.parseAsync( process.argv );
	} catch ( e ) {
		// if github ci, always error
		if ( isGithubCI() ) {
			Logger.error( e );
		} else if ( e.code !== 'commander.help' ) {
			// if not github ci, only error if not help
			Logger.error( e );
		}
	}
};

run();
