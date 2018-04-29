import React from 'react';
import {ScrollView, AppRegistry, Alert, StyleSheet, Text, View, Button, Dimensions, FlatList} from 'react-native';
import {Table, TableWrapper, Row} from 'react-native-table-component';
import {TextField} from 'react-native-material-textfield';

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this._updateDistance = this._updateDistance.bind(this);
        this._getRestaurantsInAreaResetFromStart = this._getRestaurantsInAreaResetFromStart.bind(this);
        this._getAllRestaurantsInArea = this._getAllRestaurantsInArea.bind(this);
        this._getCurrentLocation = this._getCurrentLocation.bind(this);
        this._getCurrentLocation();

        this.state = {
            remainingCalls: 0,
            table: {
                dataSource: [],
                tableHead: ["Name", "Address", "Phone", "Price", "Distance (miles)"],
                widthArr: [200, 350, 150, 100, 200]
            },
            query: {
                distance: "",
                total: 0,
                offset: 0
            },
            location: {
                latitude: 0,
                longitude: 0
            }

        }
    }

    _getCurrentLocation() {
        navigator.geolocation.getCurrentPosition(
            location => {
                this.setState({
                    location: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    }
                });
                setTimeout(this._getCurrentLocation, 15000);
            },
            error => {
                console.log("error", error);
                setTimeout(this._getCurrentLocation, 15000);
            }
        );
    }

    _getRestaurantsInAreaResetFromStart() {
        this.setState({
            table: {
                dataSource: [],
                tableHead: ["Name", "Address", "Phone", "Price", "Distance (miles)"],
                widthArr: [200, 350, 150, 100, 200]
            },
            query: {
                total: 0,
                offset: 0,
                distance: this.state.query.distance
            }
        });
        this._getAllRestaurantsInArea();
    }

    _getAllRestaurantsInArea() {
        if (this.state.query.offset <= this.state.query.total) {
            this._getRestaurantsInArea(this.state.query.offset)
                .then(response => {
                    this.setState({
                        remainingCalls: response.headers.map["ratelimit-remaining"]
                    });
                    response.json()
                        .then(responseJson => {
                            let table = this._buildMap(responseJson);
                            this.state.table.dataSource.push.apply(this.state.table.dataSource, table);
                            this.state.query.offset = this.state.table.dataSource.length;
                            this.setState({
                                table: {
                                    dataSource: this.state.table.dataSource,
                                    tableHead: ["Name", "Address", "Phone", "Price", "Distance (miles)"],
                                    widthArr: [200, 350, 150, 100, 200]
                                },
                                query: {
                                    total: responseJson.total,
                                    offset: this.state.query.offset,
                                    distance: this.state.query.distance
                                }
                            });
                        });
                })
                .catch(error => {
                    console.log("error", error)
                });
        }
    }

    _getRestaurantsInArea(offset) {
        let distance = parseInt(this.state.query.distance * 1609.34, 10);
        if (distance > max_dist) {
            distance = max_dist;
        }
        return fetch(`https://api.yelp.com/v3/businesses/search?latitude=${this.state.location.latitude}&longitude=${this.state.location.longitude}&radius=${distance}&categories=food, all&limit=50&offset=${offset}`,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${key}`,
                },
            });
    }

    _buildMap(responseJson) {
        let tableData = [];
        let rawData = responseJson.businesses;
        for (let i = 0; i < rawData.length; i++) {
            let distance = (0.000621371 * Number(rawData[i].distance)).toFixed(2);
            let rowData = [rawData[i].name,
                rawData[i].location.display_address.join(", "),
                rawData[i].display_phone,
                rawData[i].price,
                distance];
            tableData.push(rowData);
        }
        console.log("records", tableData.length);
        return tableData;
    }

    _updateDistance(text) {
        if (text && !isNaN(text) && Number(text) >= 0 && Number(text) <= 25) {
            this.setState({
                query: {
                    distance: Number(text).toString(),
                    total: this.state.query.total,
                    offset: this.state.query.offset
                }
            });
        } else if (text) {
            this.setState({
                query: {
                    distance: this.state.query.distance,
                    total: this.state.query.total,
                    offset: this.state.query.offset
                }
            });
        } else {
            this.setState({
                query: {
                    distance: null,
                    total: this.state.query.total,
                    offset: this.state.query.offset
                }
            });
        }
    }

    render() {
        return (
            <View class={styles.container} >
                <View style={{height: Dimensions.get("window").height * .6}}>
                    <ScrollView style={styles.marginTB}
                                horizontal={true}>
                        <View>
                            <Table borderStyle={{borderColor: '#C1C0B9'}}>
                                <Row data={this.state.table.tableHead}
                                     widthArr={this.state.table.widthArr}
                                     style={styles.header}
                                     textStyle={styles.text}/>
                            </Table>
                            <ScrollView style={styles.dataWrapper}>
                                <Table borderStyle={{borderColor: '#C1C0B9'}}>
                                    {this.state.table.dataSource.map((place, index) =>
                                        <Row key={index}
                                             data={place}
                                             widthArr={this.state.table.widthArr}
                                             style={[styles.row, index % 2 && {backgroundColor: '#F7F6E7'}]}
                                             textStyle={styles.text}/>)}
                                </Table>
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
                <View>
                    <FlatList data={[{key: `Loaded Records: ${this.state.table.dataSource.length}`},
                                     {key: `Total Records: ${this.state.query.total}`},
                                     {key: `Latitude: ${this.state.location.latitude}`},
                                     {key: `Longitude: ${this.state.location.longitude}`},
                                     {key: `Remaining Calls: ${this.state.remainingCalls}`}]}
                              renderItem={({item}) => <Text>{item.key}</Text>}/>
                </View>
                <View>
                    <TextField
                        label="Radius in miles"
                        onChangeText={text => this._updateDistance(text)}
                        value={this.state.query.distance}/>
                </View>
                <View class={styles.buttonContainer}>
                    <View>
                        <Button title="Load Data"
                                onPress={this._getRestaurantsInAreaResetFromStart}
                                disabled={!this.state.query.distance}/>
                    </View>
                    <View>
                        <Button title="Get More"
                                onPress={this._getAllRestaurantsInArea}
                                disabled={this.state.query.offset === 0 || this.state.query.total === this.state.table.dataSource.length}/>
                    </View>
                </View>
            </View>
        );
    }
}

const key = '';
const max_dist = 40000; //this is max (25 miles) the value is in meters

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    buttons: {
        flex: 1,
    },
    marginTop: {
        marginTop: 20
    },
    marginBottom: {
        marginBottom: 20
    },
    marginTB: {
        marginTop: 20,
        marginBottom: 10
    },
    header: {
        height: 50,
        backgroundColor: '#537791'
    },
    text: {
        textAlign: 'center',
        fontWeight: '100'
    },
    dataWrapper: {
        marginTop: -1
    },
    row: {
        height: 40,
        backgroundColor: '#E7E6E1'
    }
});
