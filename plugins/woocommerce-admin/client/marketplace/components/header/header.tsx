/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import './header.scss';
import HeaderTitle from '../header-title/header-title';
import HeaderAccount from '../header-account/header-account';
import Tabs from '../tabs/tabs';
import HeaderSearch from '../header-search/header-search';

export interface HeaderProps {
	selectedTab?: string | undefined;
	setSelectedTab: ( value: string ) => void;
}

export default function Header( props: HeaderProps ) {
	const { selectedTab, setSelectedTab } = props;
	return (
		<header className="woocommerce-marketplace__header">
			<HeaderTitle />
			<HeaderAccount />
			<Tabs
				selectedTab={ selectedTab }
				setSelectedTab={ setSelectedTab }
			/>
			<HeaderSearch />
		</header>
	);
}
